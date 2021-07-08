---
layout: post
title: AWS EC2 Linux用户密钥丢失恢复
date: 2021-07-08
categories: AWS
tags: [AWS, EC2, Linux, SSH]
excerpt: 记录AWS EC2 Linux实例用户密钥丢失或对应`authorized_keys`公钥文件丢失后解决方法。
---

## 前言

同事误操作删除了一台AWS EC2 Linux实例`ec2-user`用户目录下的`.ssh/authorized_keys`文件，导致无法使用SSH登录，于是就有了此篇重新配置SSH连接密钥的记录。该方法需要有AWS EC2控制台中对应操作的权限，适用于本地连接私钥丢失或远程服务器保存的密钥丢失的情况。

## 解决方法

首先，需要登录到AWS EC2控制台页面，按以下步骤生成新的密钥对并将实例的根设备卷附加到一个临时实例上。

1. 在EC2控制台的`Network & Security`页面创建新的密钥对。若是服务器丢失`authorized_keys`而非本地丢失密钥文件，可以不生成新的密钥对，也可生成新的密钥对使用。

2. 找到对应EC2实例`Storage`（存储）选项卡中`Root device name`（根设备名称），记录设备名称（例如`/dev/sda1`或`/dev/xvda`）并在`Block devices`下找到对应`Volume ID`（卷ID）。

3. 在EC2控制台中停止原始实例（`Stop instance`）。

4. 创建一个新的临时实例，并选择在第一步中创建的密钥对作为连接的密钥对（若是服务器端密钥丢失，此处可使用原密钥对）。若在同一区域下有其它现存的实例可以使用，可以选择不创建新实例，在使用不同的密钥对的情况下，在第9步中操作将有所不同，不再需要复制实例中的密钥公钥，而是根据密钥私钥生成对应的公钥，生成方法可参考下文。

5. 将原始实例的根设备卷从原始实例中分离（`Detach Volume`），在等待其状态变为`available`后附加到临时实例上（`Attach Volume`），并记下附加时设置的设备名称（例如`/dev/xvdf`）。

执行完以上步骤后，需要通过SSH连接到临时实例上进行后续的操作：

1. 通过`lsblk`命令确定卷是否已经分区，已分区的卷将带有`part`类型的分区。如下面示例中的`vxda`设备带有分区`vxda1`，而`vxdg`设备没有进行分区。若卷已分区，在下面的步骤中进行挂载时将需要挂载对应的分区（如分区`/dev/xvdf1`），否则则需要挂载原始设备（如设备`/dev/vxdg`）。

    ```bash
    $ lsblk
    NAME    MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
    xvda    202:0    0    8G  0 disk
    └─xvda1 202:1    0    8G  0 part /
    xvdf    202:80   0  101G  0 disk
    └─xvdf1 202:81   0  101G  0 part
    xvdg    202:96   0   30G  0 disk
    ```

    > 注：不同的Linux发行版的设备名称命名规则有所不同，例如可能为`/dev/sdf`、`/dev/vdg`、 `/dev/xvdk`等。

2. 创建临时的目录用于挂载卷，也可直接使用现用的目录（示例中使用`/mnt/tempvol`，可替换为其它目录）。

    ```bash
    $ sudo mkdir /mnt/tempvol
    ```

3. 使用`mount`命令将卷挂载到临时目录下，不同发行版中使用的命令可能有所不同。

    ```bash
    # Amazon Linux、Ubuntu、Debian使用
    $ sudo mount /dev/xvdf1 /mnt/tempvol
    # Amazon Linux 2、CentOS、SUSE Linux 12、RHEL 7.x使用
    $ sudo mount -o nouuid /dev/xvdf1 /mnt/tempvol
    ```

    > 若执行`mount`命令时提示文件系统受损错误，可通过`fsck`命令修复。
    > ```bash
    > $ sudo fsck /dev/xvdf1
    > ```

4. 更新挂载的卷中的`authorized_keys`文件，在不同发行版中该文件位置将有所不同。如在Amazon Linux中其目录为`/home/ec2-user/.ssh/authorized_keys`，其它发行版中可能使用不同的位置或不同的用户名，例如Ubuntu中使用`ubuntu`。挂载卷中的目标位置需在对应文件目录前加上挂载的目录，例如`/mnt/tempvol/home/ec2-user/.ssh/authorized_keys`。

    - 若使用临时实例中的密钥公钥，则将其复制到挂载卷中对应的位置。

        ```bash
        $ cp .ssh/authorized_keys /mnt/tempvol/home/ec2-user/.ssh/authorized_keys
        ```

        若出现权限不足的情况，请使用`sudo`复制后再修改挂载卷中的密钥公钥所属的用户和组。

        ```bash
        # 获得原authorized_keys所属的用户user及用户组group
        $ ls /mnt/tempvol/home/ec2-user/.ssh
        total 4
        -rw------- 1 <user> <group>  381 Dec 23  2019 authorized_keys
        # 复制密钥公钥
        $ sudo cp .ssh/authorized_keys /mnt/tempvol/home/ec2-user/.ssh/authorized_keys
        # 修改用户及用户组
        $ sudo chown <user>:<group> /mnt/tempvol/home/ec2-user/.ssh/authorized_keys
        ```

    - 若是使用新生成未绑定的密钥，需要使用`ssh-keygen`命令获取对应的密钥公钥。

        ```bash
        $ ssh-keygen -y -f key-pair.pem
        ```

5. 使用`unmount`命令卸载已挂载的卷。

    ```bash
    $ sudo unmount /mnt/tempvol
    ```

将挂载的卷卸载后，可以断开SSH连接，回到AWS EC2控制台，进行后续的操作。

1. 将原始卷从临时实例中分离，待其状态变回到`available`后将其重新附加到原始实例上。附加时设备名称需要填写为第2步中记录的原始根设备名称（例如`/dev/xvda`）。

2. 使用`ssh`连接测试，待成功后若无需再使用临时实例，可将其终止，避免产生额外的费用。

## SSH连接出现`REMOTE HOST IDENTIFICATION HAS CHANGED!`且连接失败

在重设服务器端用户`authorized_keys`后重新连接服务器，可能会连接失败且出现以下内容提示：

```bash
$ ssh ***@***.***.***.***
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
Someone could be eavesdropping on you right now (man-in-the-middle attack)!
It is also possible that a host key has just been changed.
The fingerprint for the ECDSA key sent by the remote host is
SHA256:*******************************************.
Please contact your system administrator.
Add correct host key in /home/***/.ssh/known_hosts to get rid of this message.
Offending ECDSA key in /home/***/.ssh/known_hosts:3
ECDSA host key for ***.***.***.*** has changed and you have requested strict checking.
Host key verification failed.
```

该错误产生原因是本地保存的密钥指纹信息和远程服务器发送的ECDSA密钥指纹信息不符。该错误出现时若不是被信任修改，则可能存在中间人攻击的安全风险。

因为在这里该错误产生的原因是我们更新了服务器上的用户登陆密钥，所以只需要刷新本地保存的密钥指纹信息即可，解决办法可选择以下任意一种：

- 手动删除用户目录下`~/.ssh/known_hosts`文件中远程服务器IP对应的信息。

- 使用`ssh-keygen -R <ip>`命令更新，运行后会有以下类似的提示：

  ```bash
  $ ssh-key -R ***.***.***.***
  # Host ***.***.***.*** found: line xxx
  /home/***/.ssh/known_hosts updated.
  Original contents retained as /home/***/.ssh/known_hosts.old
  ```

## 参考资料

- [丢失私有密钥时连接到 Linux 实例](https://docs.aws.amazon.com/zh_cn/AWSEC2/latest/UserGuide/replacing-lost-key-pair.html)
- [Amazon EC2 密钥对和 Linux 实例](https://docs.aws.amazon.com/zh_cn/AWSEC2/latest/UserGuide/ec2-key-pairs.html)