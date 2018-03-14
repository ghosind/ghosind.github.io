---
layout: post
title: IntelliJ IDEA社区版通过Maven创建J2EE项目
date: 2018-03-13
categories: [Java]
tags: [J2EE, IDEA, Maven]
excerpt: 通过Maven在默认不支持J2EE的IntelliJ IDEA社区版中创建J2EE项目。
---

## 前言

IntelliJ IDEA是常用的Java IDE之一，也受到很多人的喜爱。但是默认的情况下只有需要付费的Ultimate版才支持J2EE项目，免费的IDEA社区版不支持创建J2EE项目。由于当时安装Linux分配的存储空间很小，又习惯了用IDEA，于是就懒得另外去装个Eclipse来开发J2EE的项目，便研究了一下如何使用社区版创建J2EE项目。

## 前提要求

在开始之前要安装并配置好以下软件：

- IntelliJ IDEA Community Edition（安装Maven Plugin）
- JDK
- Tomcat

## 创建项目

首先，打开IDEA创建一个新Maven项目，勾选`Create from archetype`，并在列表中选中`org.apache.maven.archetypes:maven-archetype-webapp`。

![创建Maven项目](/assets/images/java/maven/2018-03-13-build-j2ee-with-maven/create-project.png)

点击Next，填写项目信息，并完成项目的创建。项目创建完成后将会根据选择的archetype创建相应的文件和目录，这个过程可能需要较长的时间。完成后的文件及目录如下图所示。

![项目结构](/assets/images/java/maven/2018-03-13-build-j2ee-with-maven/project-structure.png)

## 配置Maven

添加tomcat7-maven-plugin插件，好像没有继续开发后续版本，但经过测试Tomcat8可正常使用该插件。在pom.xml文件中的`<build></build>`标签内添加tomcat7-maven-plugin。

```xml
<plugins>
  <plugin>
    <groupId>org.apache.tomcat.maven</groupId>
    <artifactId>tomcat7-maven-plugin</artifactId>
    <version>2.2</version>
    <configuration>
      <url>http://localhost:8080/manager/text</url>
      <username>admin</username>
      <password>passwd</password>
    </configuration>
  </plugin>
</plugins>
```

成功添加tomcat7-maven-plugin插件后，IDEA的Maven Projects视图下将出现tomcat7。

![添加插件](/assets/images/java/maven/2018-03-13-build-j2ee-with-maven/maven-projects.png)

## 部署

编辑Tomcat配置目录下的tomcat-users.xml文件，例如`/etc/tomcat8/tomcat-users.xml`，加入manager-script权限的用户，帐号密码须与pom.xml设置相同。

```xml
<role rolename="manager-script" />
<user username="admin" password="admin" roles="manager-script" />
```

编辑完成后，通过`service tomcat8 restart`重启Tomcat8，再通过IDEA中的Maven Projects视图运行`tomcat7:deploy`部署后即可。部署完成后可以通过`http://localhost:8080/project-name`访问创建的J2EE站点，实际URL按项目和Tomcat的设置决定。

![插件命令](/assets/images/java/maven/2018-03-13-build-j2ee-with-maven/tomcat-plugin.png)

### 热部署

在完成上述配置后，除使用`tomcat7:deploy`进行部署外，还可进行其它的操作。其中，常用的就是使用`tomcat7:redeploy`进行热部署，即无需重启Tomcat便可完成新版的部署。