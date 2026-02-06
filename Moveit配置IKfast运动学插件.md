# Moveit配置IKfast运动学插件

### 0. 环境配置

- 系统版本：Ubuntu20.04
- ROS版本：Noetic
- 参考教程：[鱼香ROS版教程连接](https://fishros.org.cn/forum/topic/680/moveit-ikfast%E8%BF%90%E5%8A%A8%E5%AD%A6%E6%8F%92%E4%BB%B6%E9%85%8D%E7%BD%AE-%E6%9C%80%E8%AF%A6%E7%BB%86-%E6%B2%A1%E6%9C%89%E4%B9%8B%E4%B8%80)

### 1. 安装Docker拉取代码及镜像

#### 1.1 安装Docker

- 打开终端，输入一键安装代码，获取脚本

```bash
wget http://fishros.com/install -O fishros
```

- 接着给脚本运行权限

```bash
sudo chmod +x .fishros
```

- 运行脚本，根据提示选择**一键安装Docker**

```bash
./fishros
```

- 注：如果不选择一键安装Docker，需要自己拉取镜像（需要魔法）

```bash
docker pull fishros2/openrave
```

#### 1.2 拉取所需代码

```bash
git clone https://github.com/Elite-Robots/ROS elite_robot
```

#### 1.3 获取并运行镜像

- 打开终端运行下面的代码,会进入镜像的交互终端,此时不要关闭,我们开始下一步

```bash
cd elite_robot
xhost + && sudo docker run  -it --rm  -v /tmp/.X11-unix:/tmp/.X11-unix --device /dev/snd -e DISPLAY=unix$DISPLAY  -v `pwd`:`pwd`  -w `pwd` -v /etc/apt/:/etc/apt/:ro fishros2/openrave
```

- 参数解释如下：

  - ​`-it`：这个选项允许与容器进行交互，同时保持标准输入输出通道打开
  - ​`--rm`：表示在Docker容器停止后自动删除它，以防止容器文件堆积
  - ​`-v /tmp/.X11-unix:/tmp/.X11-unix`：该选项将主机的X11 UNIX套接字目录映射到容器的相同目录，以便容器可以连接到主机的X服务器
  - ​`--device /dev/snd`：该选项将主机的音频设备映射到容器，使容器能够访问主机的音频
  - ​`-e DISPLAY=unix$DISPLAY`：该选项将主机的Display环境变量传递给容器，以便容器可以连接到主机的X服务器
  - ​`-v pwd:pwd`：该选项将当前工作目录挂载到容器的相同目录中，以便容器可以访问主机上的文件
  - ​`-w pwd`：该选项将容器的工作目录设置为当前工作目录
  - ​`-v /etc/apt/`：挂载该目录到容器中，使容器能够共用物理机的软件源
  - ​`-v /etc/apt/:ro`：表示该目录在容器中是只读的，防止在容器中修改导致物理机软件源失效
  - ​`fishros2/openrave`：Docker镜像名称，其中包含了OpenRAVE环境

#### 1.4 编译代码

- 接着在**1.3**的终端里输入编译命令

```bash
catkin_make
```

- 此过程可能会因为缺少依赖，出现编译报错，根据提示安装对应依赖包

```bash
sudo apt update
//例如
sudo apt install -y ros-noetic-rviz-visual-tools ros-noetic-moveit-visual-tools ros-noetic-pcl-ros
```

- 编译完source工作空间

```bash
source devel/setup.bash
```

### 2. 生成机械臂dae描述文件

- **注意：路径中不要有中文**
- 接着在**1.4**的终端里输入下面的指令，将URDF文件转换为openrave支持的dae格式，接着修改里面数据的精度信息，5代表小数点后四位

  > SolidWorks导出机械臂URDF详细教程[^1]
  >

```bash
cd src/elite_description/urdf/
rosrun collada_urdf urdf_to_collada ec66_description.urdf ec66_description.dae

/*
如果在solidworks中模型坐标系配置合理，该步骤可以省略，否则可能会出现求不出解的问题
该步骤可能会报错，原因是超出了xml解析器的最大行字符限制
目前解决办法为更换解析器，但实测精度会影响生产的IKfast求解器所求逆解的准确性
但 如果各轴坐标系能够按一定标准来选取，在使用默认较高精度的情况下也可以成功生成IKfast_cpp
*/
rosrun moveit_kinematics round_collada_numbers.py ec66_description.dae ec66_description.dae 5
```

- 转换后可以使用openrave进行可视化(这一步可能会闪退,不过没关系,继续即可)

```bash
openrave ec66_description.dae
```

- 也可以使用命令行来查看机器人的`link`​和`joint`

```bash
//查看机器人的link信息
$>openrave-robot.py ec66_description.dae --info links
name      index parents  
-------------------------
world     0          
base_link 1     world  
link1     2     base_link
link2     3     link1  
link3     4     link2  
link4     5     link3  
link5     6     link4  
link6     7     link5  
flan      8     link6  
-------------------------
name      index parents 

//查看机器人的joint信息，该步骤可以省略
$>openrave-robot.py ec66_description.dae --info joints
name        joint_index dof_index parent_link child_link mimic
--------------------------------------------------------------
joint1      0           0         base_link   link1       
joint2      1           1         link1       link2       
joint3      2           2         link2       link3       
joint4      3           3         link3       link4       
joint5      4           4         link4       link5       
joint6      5           5         link5       link6       
world_joint -1          -1        world       base_link   
flan_joint  -1          -1        link6       flan        
--------------------------------------------------------------
name        joint_index dof_index parent_link child_link mimic
```

### 3. 生成IFfast代码文件测试

#### 3.1 生成IKfast文件

- 完成第二部分,我们就可以通过一句命令来生成ikfast针对ec66机械臂的正逆解代码,接着上面的终端输入下面的指令,接着让指令跑一会

```bash
python `openrave-config --python-dir`/openravepy/_openravepy_/ikfast.py --robot=ec66_description.dae --iktype=transform6d --baselink=1 --eelink=8 --savefile=$(pwd)/ikfastec66.cpp
```

- 结束后你应该可以再当前文件夹生成一个ikfastec66.cpp文件，这个文件就是针对我们当前的机械臂所生成的快速求解的程序，接着我们可以将其编译成可执行文件进行测试

#### 3.2 编译测试

- 复制所需的头文件，接着直接使用g++进行编译

```bash
cp /usr/local/lib/python2.7/dist-packages/openravepy/_openravepy_/ikfast.h .
g++ ikfastec66.cpp -o ikfast-ec66 -llapack -std=c++11
```

- 编译完后得到一个可执行文件ikfast-ec66
- 输入指令可以看看其使用方法,输入空间中的坐标的旋转矩阵和平移矩阵，即可逆解出关节的角度；说白了就是你告诉它末端flan坐标系的位置，它告诉你机械臂六个轴在多少度的时候才能到达

```bash
./ikfast-ec66
```