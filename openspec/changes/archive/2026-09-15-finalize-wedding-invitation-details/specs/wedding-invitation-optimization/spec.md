## ADDED Requirements

### Requirement: Consistent confirmed wedding details
总览页、三个完整邀请函方案和纸张方案分享卡片 SHALL 一致展示已确认的新人、典礼时间和酒店信息，且 MUST 不以旧占位文案覆盖已确认内容。

#### Scenario: Visitor reads any wedding page
- **WHEN** 用户打开总览页或任一完整邀请函方案
- **THEN** 页面展示新郎陈栢成与新娘任鹭
- **THEN** 页面将典礼时间展示为 2026 年 10 月 6 日 10:58
- **THEN** 页面将地点展示为辽阳市龙和缘酒店

#### Scenario: Recipient sees the editorial share card
- **WHEN** 社交平台读取纸张方案的分享元数据和封面
- **THEN** 分享标题或封面展示陈栢成与任鹭
- **THEN** 分享描述或封面展示 10 月 6 日 10:58 与辽阳市龙和缘酒店

## MODIFIED Requirements

### Requirement: Save-the-date download
每个完整邀请函方案 SHALL 提供同一个静态日历下载入口，且日历 MUST 只包含已经确认可公开的信息；准确时间和地点已确认时 SHALL 使用定时事件，否则 SHALL 保留不含推断信息的全天提醒。

#### Scenario: Download calendar entry before exact details exist
- **WHEN** 用户点击“保存日期”且准确时间和城市仍待补充
- **THEN** 下载项记录 2026 年 10 月 6 日全天并在描述中说明婚礼在上午
- **THEN** 日历文件不包含手机号、酒店或未确认地点

#### Scenario: Download calendar entry after details are confirmed
- **WHEN** 用户点击“保存日期”
- **THEN** 下载项记录陈栢成与任鹭的婚礼典礼及 2026 年 10 月 6 日 10:58 开始时间
- **THEN** 下载项地点为辽阳市龙和缘酒店
- **THEN** 日历文件不包含手机号、详细街道地址或未确认的结束时间

### Requirement: Safe incomplete invitation content
系统 SHALL 使用用户明确提供的信息替换对应占位内容，对仍未提供的字段 SHALL 保持明确占位，同时 MUST 不从照片、文件名或上下文推断未知信息。

#### Scenario: Publish optimized preview before final content
- **WHEN** 优化页面被构建且姓名、城市或准确时间仍未知
- **THEN** 未知姓名、城市和准确时间仍显示为现有占位内容
- **THEN** 页面不新增推断出的个人信息

#### Scenario: Publish formal invitation with confirmed details
- **WHEN** 正式信息版本被构建
- **THEN** 姓名、城市、酒店和典礼时间不再显示待补充占位
- **THEN** 页面不新增手机号、详细街道地址、未确认流程或其他推断出的个人信息
