玩《FC Mobile》完全够用，玩《eFootball》也能接受，属于“还能打”的水平，不会有明显的卡顿到影响操作的问题。
所以球网肯定是会动的。


球网运动执行层文件：net_move.cpp
开关函数：python的switch_mask

球网模拟开关：WorldFxType::NetMove==1
开关传入函数：Python的init(... switch_mask)

各球场switch逻辑所在文件：
WorldStadiumLv3.py:221
WorldRush.py
WorldCampNou.py

switch_mask逻辑代码：
switch_mask = self._build_field_fx_switch_mask(
    Game.graphicSettings().enableGateShake,
    Game.graphicSettings().enableClothNet,   # ← 球网运动开关
    Game.graphicSettings().enableGateShake
)

机型分级逻辑源头文件：Package\Script\Python\dm33\Utils\GraphicSettings.py:672
启动球网python函数：self.enableClothNet = deviceConfig.EnableClothNet[quality]
画质档分级：LOW/MIDDLE/HIGH/USER_DEFINED 等
MB计算画质档位函数：launchrule.getMobileDeviceQuality()
PC计算画质档位函数：get_device_quality()
按机型档读配置表函数：deviceConfig = Datas.GraphicSettings[self.deviceQuality]

控制流：机型 → 画质档(quality) → 配置表 EnableClothNet[quality] → enableClothNet → switch_mask → C++ NetMove
导表配置文件：Package\Script\Python\dm33\Data\GraphicSettings.py
球网控制字段：self.EnableClothNet = k2b
按档位编码的数组值：k2b
字段名映射位置：GraphicSettings.py:259 'EnableClothNet': 'enableClothNet'

运行时强制开关：debug_gui.py:6505：Game.graphicSettings().enableClothNet = not ... 手动切布料球网

设备配表：E:\scrum\doc\Design\导表\导表_画质设置.xlsx
配表画质设置白名单数据存在：false
当前实际画质档位计算函数：get_device_quality()

三星A52对应机型：SM-A5260
设备评级函数：launchrule.getMobileDeviceQuality()
设备评级文件行数：DeviceModelLevel.py:1301

三星A52对应画质档位：LOW

选设备配置文件行数：GraphicSettings.py:601
选设备配置函数：deviceConfig = Datas.GraphicSettings[1] → Data/GraphicSettings.py 的 _Datas[1]

确定画质档位函数：quality = deviceConfig.DefaultQuality = 0

取球网开关文件行数：Package\Script\Python\dm33\Utils\GraphicSettings.py:672
下发到C++的流程：enableClothNet=False → _build_field_fx_switch_mask 不置 WorldFxType.NetMove 位 → C++ world_fx_mgr 的 switch 关 → net_move.cpp 不执行球网模拟 → 球网不动。

A52 5G 被评为低端设备（行 quality=1），其 DefaultQuality=0 又落到最低画质档(_1)，双重命中关闭项。

'''
我查了一下设备配置，SM-A5260在配置里面是低端机。然后默认画质效果是低。这两种情况叠加到一起，走配表，球网运动就是关着的。这块儿应该可以通过改配表进行修改。
具体是这张表：doc\Design\导表\导表_画质设置.xlsx
单子是：#6613 【BUG】【局内-球网】mumu模拟器上，机型选三星 A52，球网会丢失物理效果
具体负责这块儿的策划是谁呢？
这块儿要不要问问策划，具体想怎么设计？如果想要改A52 5G的默认类型，就是一行python。
如果希望任何机型球网都动，就是改表。
'''

