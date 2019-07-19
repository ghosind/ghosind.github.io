---
layout: post
title: Node.js中使用AWS SNS服务发送短信
date: 2019-07-11
categories: AWS
tags: [AWS, SNS, Node.js]
excerpt: 在Node.js中实现通过AWS SDK使用AWS SNS服务发送短信。
---

## 前言

> Amazon Simple Notification Service (Amazon SNS) is a web service that coordinates and manages the delivery or sending of messages to subscribing endpoints or clients. In Amazon SNS, there are two types of clients—publishers and subscribers—also referred to as producers and consumers. Publishers communicate asynchronously with subscribers by producing and sending a message to a topic, which is a logical access point and communication channel. Subscribers (i.e., web servers, email addresses, Amazon SQS queues, AWS Lambda functions) consume or receive the message or notification over one of the supported protocols (i.e., Amazon SQS, HTTP/S, email, SMS, Lambda) when they are subscribed to the topic. <sup>[1]</sup>

正如SNS的介绍所述，SNS是AWS提供的一个消息收发服务，它包括了诸如消息推送、短信、电子邮件等服务。AWS官方文档提供了非常多的内容，但提供的示例代码是以Java或.Net为主，关于Node.js的直接资料较少，所以这里便来介绍如何使用AWS SNS服务发送短信。

## Node.js中使用SNS发送短信

在Node.js中使用AWS的服务，需要先安装`aws-sdk`依赖。AWS SDK中包括了众多服务的接口，在这里我们需要的是AWS.SNS类。首先，需要实例化AWS.SNS对象，其构造函数的参数为一个对象，通常需要包括`accessKeyId`、`secretAccessKey`、`region`等属性。在AWS IAM中，可生成并下载使用的用户对应的`accessKeyId`及`secretAccessKey`。需要注意的是，使用的用户需要在IAM中设置SNS对应的权限。

```js
const AWS = require('aws-sdk');

const options = {
  accessKeyId: 'String',
  secretAccessKey: 'String',
  apiVersion: '2010-03-31',
};

const snsService = new AWS.SNS(options);
```

通过AWS.SNS类的实例，就可以使用其进行SNS服务的相关操作。本文的主题为使用SNS服务发送短信，所以接下来即可通过AWS.SNS实例的`publish`方法以短信形式发送消息。

AWS SDK for Node.js中，`publish`方法接收一个Object类型的参数，它其中包括`Message`、`MessageAttributes`、`MessageStructure`、`PhoneNumber`、`Subject`、`TargetArn`以及`TopicArn`属性。`publish`是一个SNS中通用的方法，发送邮件、消息推送也是通过它进行完成，所以在发送短信时部分的参数不是必须的。下面是一个发送短信所需最少参数的例子。

```js
const params = {
  Message: text,
  MessageAttributes: {
    'AWS.SNS.SMS.SMSType': {
      DataType: 'String',
      StringValue: 'Transactional', // Transactional or Promotional
    },
    // AWS.SNS.SMS.MaxPrice
    // AWS.SNS.SMS.SenderId
  },
  PhoneNumber: phoneNumber, // 电话号码，需要遵从E.164格式
};
```

在`MessageAttributes`的`AWS.SNS.SMS.SMSType`参数中，其值需为`Transactional`或`Promotional`。二者的区别为`Transactional`更为可靠，但其价格通常更为昂贵，一般用于发送较为重要的消息（如短信验证码等），而`Promotional`一般用于发送推广信息。另外`AWS.SNS.SMS.MaxPrice`为愿意为发送消息支付以美元为单位的最高金额；`AWS.SNS.SMS.SenderId`为一个在接收设备上显示的自定义ID，但其支持程度受所在地区限制，如中国便不支持SenderId的显示。

使用上面定义的参数调用`publish`方法即可发送短信。`publish`方法提供了基于Promise的异步使用方法，只需将代码修改为：`const response = await snsService.publish(params).promise();`。

```js
snsService.publish(params, (err, data) => {
  if (err) {
    // ...
  }
  // ...
})
```

### 返回结果

在参数错误、权限不足等情况下，调用publish接口将会抛出诸如`InvalidParameter`、`AuthorizationError`等错误，可根据其具体错误信息判断错误原因。调用publish接口将会返回下述结果。其中，MessageId为该消息的唯一标识符，当开启CloudWatch Logs后可通过该标识符获取消息的传输信息。

```json
{
  "ResponseMetadata":{
    "RequestId":"bfb2a062-c201-5d34-a7d8-f5fd653b27f9"
  },
  "MessageId":"2b38eec7-a3f0-5679-a116-bb5804cadcb4"
}
```

### 未收到短信

调用publish接口成功并正常返回结果，不代表短信发送成功。短信发送失败的原因可能是下列其中一个：

- 被电话运营商作为垃圾消息屏蔽
- 目标已加入黑名单
- 电话号码无效
- 消息正文无效
- 电话运营商已屏蔽此消息
- 电话运营商目前无法访问/不可用
- 电话已屏蔽SMS
- 电话已加入黑名单
- 电话当前无法访问/可用
- 电话号码已退出
- 此传输会超过最高价格
- 尝试联系电话时发生未知错误

publish接口返回的结果无法得知短信发送是否成功，只有在开启CloudWatch Logs功能后才能从日志中获取短信是否发送成功及发送失败的原因。

## 结束语

AWS的free tier提供了每月100条的免费短信可以使用，但需要注意的是此处的免费短信接收方为美国号码。若要发送短信至国内号码，价格约为0.01531 USD（约0.11元），该价格相对于国内服务商较为昂贵。另外，SNS发送短信至国内时失败率也较高，且在发送失败的情况下也是按正常价格收取费用。在实际开发中，若不是以海外业务为主的情况下，可考虑国内服务商提供的短信服务。

## 参考资料

1. [Amazon Simple Notification Service Developer Guide](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)
2. [AWS Javascript SDK Docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SNS.html)