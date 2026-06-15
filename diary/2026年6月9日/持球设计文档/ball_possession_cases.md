# 球权归属判定 - 场景 Case 分析

> 基于 `BallOwnerManager.py` + `TakeBallManager.cpp` 的事件流分析  
> 范围：E_STATE_PLAY 正常比赛阶段

---

## 基础机制说明

在看具体场景之前，需要先理解两条核心规则：

**规则1：球权归属有两个独立来源**

| 来源 | 触发时机 | 是否立即生效 |
|---|---|---|
| **事件驱动**（Python） | `E_PASS / E_SHOOTING / E_CHANGE_DRIBBLER` 发生时 | 缓存到下一帧 `late_tick_1` 生效 |
| **预测提前给**（C++） | `TakeBallManager._update_ball_owner()` 判断胜负 | 同帧立即通过 `cpp_change_ball_owner()` 生效 |

**规则2：`E_TOUCHBALL` / `E_HITPLAYER` 不直接给球权**  
这两个事件只更新 `last_touch_ball_team`（最后碰球队伍记录），不触发 `change_ball_owner()`。

**规则3：`E_TOUCHBALL_NO_PLAY`**  
"无效触球"事件，不会更新任何球权相关字段，仅供表现层/统计使用。

---

## Case 1：点对点传球（正常接球）

> 场景：A队球员 P1 向队友 P2 传球，P2 完整接住

```
时间线：
  帧 N    - P1 出脚
             └─→ 触发 E_PASS（initator=P1）
             └─→ BallOwnerManager._on_event → record_temp_dribbler_change(P1.eid)
                   └─→ 因为 game_state==E_STATE_PLAY：只设 dribbler_change_flag=True，不立即给

  帧 N~M  - 球飞行中
             ├─→ TakeBallManager: cur_stage = Passing，dribbling_id = EID_EMPTY
             ├─→ P2 的 take_frame 被设置（动画系统预测接球帧）
             └─→ _update_ball_owner() 每帧检查：
                   - 只有 P2 有 take_frame
                   - take_frame - cur_frame < SINGLE_SWITCH_BALL_TIME
                   └─→ 条件满足 → 提前调 py_change_ball_owner(A队, P2, is_early=True)
                         └─→ ball_owner 切换为 A队（尽管 P1 本身也是 A队，球权不变）

  帧 M    - P2 实际接球
             └─→ 触发 E_CHANGE_DRIBBLER（P2）
             └─→ change_ball_owner(A队, P2)
                   └─→ ball_owner 已经是 A队，is_changed=False → 不广播 E_CHANGE_BALL_OWNER
```

**球权结果**：始终在 A 队，`E_CHANGE_BALL_OWNER` 不触发（因为传球前后是同队）。  
**攻防状态**：无变化。

---

## Case 2：传球被拦截（防守方成功断球，控球）

> 场景：A队 P1 传给 P2，B队 P3 拦截并成功控球

```
时间线：
  帧 N    - P1 出脚
             └─→ E_PASS → dribbler_change_flag=True，new_dribbler=P2

  帧 N~M  - 球飞行中
             ├─→ P2 的 take_frame 被设置（初始 taker=P2）
             ├─→ P3 触发拦截动作，P3 的 take_frame 也被设置
             └─→ TakeBallManager._update_ball_owner():
                   - takers = [P3(B队), P2(A队)] 或 takers = [P2(A队), P3(B队)]
                   - 比较 take_frame：P3 更早拿到球
                   - 帧差 > TIME_DIFF_THRESHOLD
                   └─→ 提前给球权给 B队：py_change_ball_owner(B队, P3, is_early=True)
                         └─→ ball_owner 切换为 B队
                         └─→ 触发 E_CHANGE_BALL_OWNER（A队 → B队）

  帧 M    - P3 实际控球
             └─→ E_CHANGE_DRIBBLER(P3)
             └─→ change_ball_owner(B队, P3) → is_changed=False（已经是B队），不再广播
```

**球权结果**：B队获得球权。  
**攻防状态切换**：触发一次，在提前给球权阶段（`is_early=True`）。  
**关键细节**：HR 系统、阵型任务在 `E_CHANGE_BALL_OWNER` 时立即重置，不是等 P3 真正控球才切。

---

## Case 3：传球被拦截（防守方碰到球但未控球，球继续滚动）

> 场景：A队 P1 传球，B队 P3 伸脚触碰到球但未控住，球滚开

```
时间线：
  帧 N    - P1 出脚 → E_PASS → dribbler_change_flag=True，new_dribbler=P2

  帧 M    - P3 碰球
             └─→ 触发 E_TOUCHBALL（initator=P3）
             └─→ BallOwnerManager._on_event:
                   event_name==E_TOUCHBALL → 只调 record_last_touch_ball_team(P3.eid)
                   → last_touch_ball_team_eid = B队.eid
                   → ⚠️ 不调 record_temp_dribbler_change，球权不变！

             └─→ TakeBallManager:
                   - 因为 P3 碰球后没有进入接球动画，take_frame 未被设置
                   - P2 的 take_frame 若还在，仍会提前给球权给 A队
                   - 若 P2 的 take_frame 也被清空（接球失败），进入 NoDribbing 阶段

  帧 M+   - 球无主，NoDribbing 阶段
             └─→ NewChaseRule 重新选追球人
             └─→ TakeBallManager 等待新的 taker 被设置后再判断球权
```

**球权结果**：触碰瞬间球权**不变**（仍是 A队），但 `last_touch_ball_team` 更新为 B队。  
**实际影响**：球权要等到有人真正"拿到球"后才切换。  
**注意**：这就是为什么会有"碰了但没球权"的表现——AI 的跑位和任务此时仍按 A队有球权处理。

---

## Case 4：直塞球（Through Pass，接球成功）

> 场景：A队 P1 直塞给后插上的 P2，P2 进入直塞接球动画并成功控球

```
时间线：
  帧 N    - P1 出脚（StraightPass.py）
             └─→ 触发 E_PASS（same as 普通传球）
             └─→ record_temp_dribbler_change(P2) → dribbler_change_flag=True

  帧 N~M  - 球飞行中（关键：直塞球空间更大，飞行时间更长）
             ├─→ P2 进入 PRE_RUN_TAKE_PASS 动画（预跑接球）
             ├─→ P2 的 take_frame 被设置（预测接球点）
             ├─→ B队防守球员 P4/P5 的 take_frame 也可能被设置（拦截判定）
             └─→ TakeBallManager 持续比较 P2 vs 最近防守者 take_frame

  帧 M-k  - 若 P2 明显更早（帧差 > TIME_DIFF_THRESHOLD）
             └─→ 提前给球权给 A队（P2）
             └─→ 触发 E_CHANGE_BALL_OWNER（若球权之前不在 A队）

  帧 M    - P2 实际控球
             └─→ E_CHANGE_DRIBBLER(P2) → change_ball_owner(A队) → 不再广播
```

**球权结果**：A队保持或获得球权，提前给球权时机比普通传球更显著（因飞行时间长，提前量更大）。  
**关键差异**：直塞由于飞行时间长，`_update_ball_owner()` 会在很多帧内持续检查，防守球员如果追上来导致帧差缩小，球权预判可能在给出后又被撤销（`last_judge_eid` 防抖机制就是为此设计的）。

---

## Case 5：直塞球被防守方先触碰（拦截但未控）

> 场景：P1 直塞，B队 P4 滑铲/伸脚接触到球，但球弹出无人控制

```
时间线：
  帧 N    - P1 出脚 → E_PASS

  帧 M    - P4 接触到球
             ├─→ 如果是 E_HITPLAYER（身体接触/碰撞类）：
             │     └─→ record_last_touch_ball_team(P4) — 只记录，不给球权
             └─→ 如果是 E_TOUCHBALL（脚触球类）：
                   └─→ record_last_touch_ball_team(P4) — 只记录，不给球权

  帧 M+   - 球弹出，NoDribbing 阶段
             └─→ TakeBallManager 清空 takers，等待新追球人
             └─→ 此时球权字段仍是 A队（E_PASS 时给的）
             └─→ NewChaseRule 重新指派追球人
             └─→ 谁先拿到球，_update_ball_owner() 才切换球权
```

**球权结果**：弹出瞬间球权不变（A队），直到有人真正拿球。  
**HR/阵型行为**：A队仍按进攻阵型跑位（因为 `IsOwningBall()`=True），B队按防守阵型跑位。  
**潜在问题点**：球弹出后若 B队率先追到，有 `SWITCH_BALL_OWNER_STAY_FRAME` 帧的延迟才正式切换，这段时间内 A队 HR 跑位仍按进攻执行。

---

## Case 6：成功铲球夺球（Tackle 后控球）

> 场景：B队 P4 对持球的 A队 P1 成功铲球，P4 控住球

```
时间线：
  铲球前  - A队 P1 持球，ball_owner = A队

  铲球帧  - 铲球判定成功
             ├─→ P1 丢球：E_LOSEBALL（P1）
             │     └─→ BallOwnerManager 不监听 E_LOSEBALL，球权不变
             ├─→ 触发 E_TACKLE（动画系统处理）
             └─→ P4 开始接球动画，take_frame 被设置

             → TakeBallManager: 进入 NoDribbing 阶段
             → _update_ball_owner(): 只有 P4（B队）有 take_frame
                └─→ take_frame - cur_frame < SINGLE_SWITCH_BALL_TIME
                └─→ 提前给球权给 B队
                └─→ 触发 E_CHANGE_BALL_OWNER（A队 → B队）

  控球帧  - P4 实际控球 → E_CHANGE_DRIBBLER(P4) → ball_owner 已是 B队，不再广播
```

**球权结果**：B队获得球权，`E_CHANGE_BALL_OWNER` 触发一次（提前给时）。  
**注意**：`E_LOSEBALL` 不触发球权变更，丢球和球权切换是解耦的。

---

## Case 7：射门被扑出，球弹在禁区内无人控制

> 场景：A队 P1 射门，守门员 GK 扑出但未抱住，球弹在禁区内

```
时间线：
  射门帧  - P1 出脚
             └─→ 触发 E_SHOOTING（initator=P1）
             └─→ BallOwnerManager: E_SHOOTING ∈ CHANGE_OWNER_EVENT
                   → record_temp_dribbler_change(P1)
                   → dribbler_change_flag=True（⚠️ taker=P1，不是目标，因为射门不知道谁接）
                   → 下帧 late_tick_1：change_ball_owner(A队, P1)
                       → ball_owner = A队（本来也是，不变）

  扑出帧  - GK 碰到球（E_TOUCHBALL / E_HITPLAYER）
             └─→ 只更新 last_touch_ball_team = B队
             └─→ 球权仍是 A队

  弹球后  - 球无主，NoDribbing 阶段
             └─→ TakeBallManager 等待新 taker
             └─→ 双方球员追球，谁先确定 take_frame 且帧差够大，谁获得球权
```

**球权结果**：射门后球权归 A队（发出射门的那队），GK 扑出但未控住不触发球权切换，直到有人真正拿球。  
**特殊情况**：若守门员做出 `E_SAVE_HOLD`（抱住球），则走正常 `E_CHANGE_DRIBBLER(GK)` 流程，球权切给 B队。

---

## Case 8：解围球（Clearance）—— 无人控球的长解围

> 场景：B队在本方禁区大脚解围，球飞向中场无人跟进

```
时间线：
  解围帧  - B队 P_GK / 后卫出脚
             └─→ 触发 E_PASS（解围也是 E_PASS，非 E_SHOOTING）
             └─→ record_temp_dribbler_change(P_GK) → 下帧给球权给 B队
             → ball_owner = B队，触发 E_CHANGE_BALL_OWNER（A队 → B队）

  飞行中  - 无人接球（解围目标 taker=None 或目标在很远）
             └─→ TakeBallManager: 进入 Passing 阶段
             └─→ 若无人的 take_frame 被设置 → _update_ball_owner 不会切换
             └─→ ball_owner 维持 B队

  落地后  - 球落地无人控，NoDribbing 阶段
             └─→ 双方追球人竞争 take_frame
             └─→ 谁先拿到，球权切给谁
```

**球权结果**：解围出脚瞬间给 B队，然后维持到有人拿球为止。  
**注意**：解围是用 E_PASS 触发的（不是 E_SHOOTING），所以走的是传球的球权逻辑。

---

## Case 9：头球争顶——双方同时跳起，无人成功控球

> 场景：双方球员同时跳起争顶定位球，头球碰撞后球弹出

```
时间线：
  争顶前  - 假设 A队有球权（角球/任意球恢复比赛）

  争顶帧  - 双方同时触球
             ├─→ A队 P1 触球：E_TOUCHBALL(P1) → last_touch_ball_team = A队
             └─→ B队 P2 触球：E_HITPLAYER(P2) 或 E_TOUCHBALL(P2)
                   → last_touch_ball_team = B队（覆盖上一次）

  结果    - 球弹出，NoDribbing 阶段
             └─→ 球权此时取决于最后一次 last_touch_ball_team（B队）
             └─→ 但 last_touch_ball_team 并不直接等于 ball_owner！
             └─→ 真正的 ball_owner 还是要等有人拿球后由 _update_ball_owner 决定

  追球竞争 - 双方追球人同时有 take_frame
             ├─→ TIME_DIFF_THRESHOLD 内：维持现有球权（不切换）
             └─→ 帧差够大：切换给先拿球的一方
```

**球权结果**：弹球后真正的球权由 `_update_ball_owner()` 的 taker 帧竞争决定，不是由最后碰球决定。  
**关键认知**：`last_touch_ball_team` ≠ `ball_owner`。前者只是事实记录，后者才是驱动 HR/Task 的球权字段。

---

## Case 10：大步趟球被抢断（StrideBall 阶段丢球）

> 场景：A队 P1 正在大步趟球，B队 P3 追上并铲球成功

```
时间线：
  趟球中  - cur_stage = StrideBall
             └─→ ball_owner = A队，dribbling_id = P1

  铲球帧  - 铲球判定（E_TACKLE 或身体对抗）
             └─→ P1 丢球：E_LOSEBALL → 不触发球权变更
             └─→ TakeBallManager: StrideBall 结束，进入 NoDribbing

  注意    - StrideBall 阶段 _update_ball_owner() 不执行（条件是 NoDribbing 或 Passing）
  NoDribbing 后：
             └─→ P3 有 take_frame，无其他竞争者
             └─→ take_frame - cur_frame < SINGLE_SWITCH_BALL_TIME
             └─→ 提前给球权给 B队
             └─→ 触发 E_CHANGE_BALL_OWNER
```

**球权结果**：P1 丢球瞬间球权**不立即切换**（E_LOSEBALL 不触发），等进入 NoDribbing 后才由 `_update_ball_owner()` 切换。  
**时间差**：存在数帧的"球权归 A队但实际 A队已无人控球"的窗口期。

---

## Case 11：传球目标接球失败（ball 到位但球员未能控住）

> 场景：A队 P1 传给 P2，P2 脚下球处理失误，球滚开

```
时间线：
  帧 N    - E_PASS → dribbler_change_flag=True，new_dribbler=P2

  帧 M    - P2 尝试接球但动画中断/失误
             └─→ 未触发 E_CHANGE_DRIBBLER（接球失败）
             └─→ TakeBallManager: P2 的 take_frame 被清空（接球动画退出）
             └─→ 若 dribbler_change_flag 仍为 True：
                   下帧 late_tick_1 时 change_ball_owner(A队, P2)
                   → ball_owner = A队（仍是 A队）

  帧 M+   - 球滚开，NoDribbing 阶段
             └─→ TakeBallManager 重新等待 taker
             └─→ 若 B队先拿，切给 B队；若 A队先拿，维持 A队
```

**球权结果**：接球失败本身不会切换球权（仍是 A队），要等 NoDribbing 阶段竞争后才可能切换。

---

## Case 12：门将拿球（扑救后抱住）

> 场景：A队射门，B队守门员 GK 成功扑住

```
时间线：
  扑救帧  - GK 执行扑救动画，最终状态为抱球
             └─→ 触发 E_CHANGE_DRIBBLER(GK)
             └─→ BallOwnerManager._on_event:
                   E_CHANGE_DRIBBLER ∈ CHANGE_OWNER_EVENT
                   → record_temp_dribbler_change(GK)
                   → dribbler_change_flag=True
                   → 下帧 late_tick_1：change_ball_owner(B队, GK)
                   → ball_owner = B队
                   → 触发 E_CHANGE_BALL_OWNER（A队 → B队）
```

**球权结果**：GK 控球时立即（下帧）切换给 B队。  
**后续**：B队 HR 切换为进攻格子，A队切换为防守格子。GK 开球由专门的 `GoalKeeperAutoPassRule` 等处理。

---

## 汇总对比表

| 场景 | 触发球权变更的事件 | 变更时机 | `E_CHANGE_BALL_OWNER` 是否触发 |
|---|---|---|---|
| 1. 同队传球接球 | E_PASS（给同队） | 提前预测/接球帧 | ❌ 不触发（同队无变化） |
| 2. 传球被拦截控球 | TakeBallManager 预测 | 提前 `k` 帧 | ✅ 触发 |
| 3. 传球被碰但未控 | — | 无主球竞争后 | ✅ 触发（若最终拿球是对方） |
| 4. 直塞接球成功 | E_PASS + 预测 | 提前预测 | ✅ 触发（若之前无球权） |
| 5. 直塞被拦截但弹出 | 无主球竞争 | 有人拿球后 | ✅ 触发（若对方先拿） |
| 6. 铲球夺球控球 | TakeBallManager 预测 | 提前 `k` 帧 | ✅ 触发 |
| 7. 射门扑出弹球 | 无主球竞争 | 有人拿球后 | ✅ 触发（若对方先拿） |
| 8. 解围球 | E_PASS | 下帧 late_tick_1 | ✅ 触发 |
| 9. 头球争顶弹出 | 无主球竞争 | 有人拿球后 | ✅ 触发（若先前不同队） |
| 10. 趟球被铲丢球 | TakeBallManager 预测 | 进入 NoDribbing 后 | ✅ 触发 |
| 11. 接球失败弹球 | 无主球竞争 | 有人拿球后 | ✅ 触发（若对方先拿） |
| 12. GK 扑救抱球 | E_CHANGE_DRIBBLER | 下帧 late_tick_1 | ✅ 触发 |

---

## 关键发现：存在延迟/窗口期的场景

以下场景存在"球权字段 ≠ 实际控球方"的窗口期，可能影响 HR 跑位/任务切换响应速度：

| 场景 | 窗口期来源 | 窗口期长度 |
|---|---|---|
| E_STATE_PLAY 中任何传球/换带球人 | 缓存到下帧 `late_tick_1` | 1 帧 |
| TakeBallManager 提前给球权 | SWITCH_BALL_OWNER_STAY_FRAME 防抖 | `SWITCH_BALL_OWNER_STAY_FRAME` 帧 |
| 碰球未控（E_TOUCHBALL） | 球权不切换，等待有人拿球 | 不确定，取决于 NoDribbing 时长 |
| E_LOSEBALL 丢球 | 丢球不触发球权变更 | 到 NoDribbing 的过渡帧数 |

---

## 附：事件 → 球权操作 速查

| 事件 | BallOwnerManager 操作 | 是否直接给球权 |
|---|---|---|
| `E_PASS` | `record_temp_dribbler_change` | ⏱ 下帧 late_tick_1 |
| `E_SHOOTING` | `record_temp_dribbler_change` | ⏱ 下帧 late_tick_1 |
| `E_CHANGE_DRIBBLER` | `record_temp_dribbler_change` | ⏱ 下帧 late_tick_1 |
| `E_TOUCHBALL` | `record_last_touch_ball_team` | ❌ 不给 |
| `E_HITPLAYER` | `record_last_touch_ball_team(hit_player)` | ❌ 不给 |
| TakeBallManager 预测 | `cpp_change_ball_owner` | ✅ 立即 |
