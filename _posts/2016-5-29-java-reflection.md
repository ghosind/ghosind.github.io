---
layout: post
title: 初识Java反射——使用反射分析类
date: 2016-5-29
categories: Java
excerpt: 使用Java的反射库Java.lang.reflect分析类中的Field、Constructor以及Method。
---

# 0x00 反射
在[维基百科](https://en.wikipedia.org/wiki/Reflection_(computer_programming))中，对于反射有这样一段的定义。   

> In computer science, reflection is the ability of a computer program to examine, introspect, and modify its own structure and behavior at runtime.
> 在计算机科学中，反射是指计算机程序在运行时可以访问、检测和修改它本身状态或行为的一种能力。

在Java中，反射库位于java.lang.reflect。反射可以在运行中分析类、查看对象等，在本文中将使用反射库分析指定的类。   

# 0x01 分析类
在Java中，类通常都是继承自某个类，可能实现某些接口，拥有域、构造函数、方法等，并且它通常拥有修饰符如public。在本小节中我们先不分析类的域、构造函数以及方法，而是先分析该类继承自何处，实现了哪些接口。定义一个类通常写为`Modifier class className extends superClassName implements interfaceName, ...`，所以我们就按这个顺序来分析各个组成部分。在下文中，将使用reflectClass代表分析的类。   
类的访问修饰符通常为public或不使用任何关键字，我们可以使用`getModifiers()`得知类的修饰符。使用`getModifiers()`得到的修饰符是一个int类型的数值，它将对应着它是由哪些修饰符构成的，如未使用修饰符其值将为0，而public的值为1，static为8。若是由多个修饰符共同组成，则获得的值为修饰符的值相加，如public static为9。虽然这个数值代表着它是由对应的修饰符构成的，但输出它并不是非常地直观，所以可以使用Modifiers.toString()将其输出为对应的关键字。   
将类的名称转换为字符串可以直接使用`toString()`方法，或者可以使用`getName()`方法，两者的区别为Class类的`toString()`方法会在该类型名称前添加“class ”。得到类的父类可以使用Class类的`getSuperClass()`方法，它将得到一个Class类实例，也可以使用`getName()`将它转换为字符串。得到类实现的接口可以通过`getInterfaces()`或`getGenericInterfaces()`方法获得，两者的区别为`getInterfaces()`将得到该类实现的所有接口，返回类型为Class\[\]，而`getGenericInterfaces()`只得到由该类直接实现的接口，返回类型为Type\[\]。   
下面将通过方法printClass输出某个类的定义。   

```java
public void printClass(Class reflectClass) {
  // 得到类描述符
  String modifiers = Modifier.toString(reflectClass.getModifiers());
  // 若无类描述符便不输出
  if (modifiers.length() != 0) {
    System.out.print(modifiers + " ");
  }
  /*
   * 因类描述符只能是public或无描述符，所以也可以直接写为：
   * if (Modifier.isPublic(reflectClass.getModifiers())) {
   *   System.out.print("public ");
   * }
   */
  
  // 输出类名
  System.out.print("class " + reflectClass.getName());
  
  // 若父类为Object便不输出，否则输出extends SuperclassName
  Class superClass = reflectClass.getSuperclass();
  if (superClass != Object.class) {
    System.out.print(" extends " + superClass.getName());
  }
  
  // 若实现了接口便输出implements InterfaceName, ...
  Class[] interfaces = reflectClass.getInterfaces();
  if (interfaces.length != 0) {
    System.out.print(" implements ");
    int n = 0;
    for (Class i : interfaces) {
      if (n != 0) {
        // 若不是第一个实现的接口便打印一个,
        System.out.print(", ");
      }
      System.out.print(i.getTypeName());
      i++;
    }
  }
  
  System.out.println(" {");
  
  // 调用其它方法输出变量、构造函数、方法
  
  System.out.println("}");
}
```

# 0x02 分析类域
在Java中，域也就是类的成员变量，可以通过`getDeclaredFields()`方法得到类中的域，它返回一个Field类型的数组。除这个方法外，也可使用`getFields()`方法，它与`getDeclaredFields()`的区别为`getField()`只返回类中的公有域，而`getDeclaredFields()`返回全部的域。在定义域时，通常由访问修饰符、类型、域名构成。与类的访问修饰符相同，域访问修饰符也通过`getModifiers()`方法获得，并通过`Modifier.toString(int)`输出。除此以外，下文中的构造函数与方法的访问修饰符也将由同样的方法获得。   
定义域时都会定义域的类型，比如是基础数据类型int、double等，或是引用类型。要得到该域的类型，可以使用`getDeclaringClass()`方法，它将返回一个Class类型的变量，可以使用`getName()`输出类名。最后，通过`getName()`方法得到域名称即可。   

```java
void printField() {
  Field[] fields = reflectClass.getDeclaredFields();

  for (Field field : fields) {
    System.out.print("\t");
    String modifiers = Modifier.toString(field.getModifiers());
    if (modifiers.length() != 0) {
      System.out.print(modifiers + " ");
    }
    Class fieldClass = field.getDeclaringClass();
    System.out.print(fieldClass.getName());
    System.out.print(" " + field.getName());
    System.out.println(";");
  }
}
```

# 0x03 分析类方法
类方法的定义也拥有修饰符也方法名，同样的，它们也是分别通过`getModifiers()`以及`getName()`获得。除此以外，方法的定义还包含返回类型以及参数。返回类型与上一节中域的数据类型一致，也是获得Class类型并利用`getName()`输出，区别是返回类型是由`getReturnType()`方法获得。   
方法的参数个数是由方法编写者确定的，它可能是一个或者多个，又或是没有参数，所以获得的参数必定为一个数组。获得参数可以使用两个不同的方法，分别是`getParameters()`与`getParameterTypes()`。二者的区别是前者将返回一个Parameter类型的数组，里面存放着参数的完整信息，包括修饰符、类型、参数名等；而后者返回的是Type类型的数组，只存放着参数的类型。若选择`getParameters()`，可以通过与上文同样的方法获得访问修饰符，并使用`getType()`获得参数类型，最后使用`getName()`输出。而使用`getParameterTypes()`则可以直接使用`getName()`输出。在本节与下一节构造函数分析中将分别使用两个方法。   

```java
void printMethod() {
  Method[] methods = reflectClass.getDeclaredMethods();

  for (Method method : methods) {
    System.out.print("\t");
    String modifiers = Modifier.toString(method.getModifiers());
    if (modifiers.length() != 0) {
      System.out.print(modifiers + " ");
    }
    
    Class returnClass = method.getReturnType();
    System.out.print(returnClass.getName() + " ");
    System.out.print(method.getName() + "(");
    
    Parameter[] parameters = method.getParameters();
    int i = 0;
    for (Parameter parameter : parameters) {
      if (i != 0) {
        // 若不是第一个参数则先输出一个,
        System.out.print(", ");
      }
      
      modifiers = Modifier.toString(parameter.getModifiers());
      if (modifiers.length() != 0) {
        System.out.print(modifiers + " ");
      }
      
      System.out.print(parameter.getType().getName() + " ");
      System.out.print(parameter.getName());
      i++;
    }
    
    System.out.println(");");
  }
}
```

# 0x04 分析类构造函数
构造函数的定义与类方法类似，区别是构造函数的名称一定为类名，且没有返回的类型。因此，我们在分析构造函数时，只需要将分析方法的代码中的Method改为Constructor，并删去获取返回类型的代码，其它基本相同。   

```java
void printConstructor() {
  Constructor[] constructors = reflectClass.getDeclaredConstructors();

  for (Constructor constructor : constructors) {
    System.out.print("\t");
    String modifiers = Modifier.toString(constructor.getModifiers());
    if (modifiers.length() != 0) {
      System.out.print(modifiers + " ");
    }
    
    System.out.print(constructor.getName() + "(");
    
    Type[] types = constructor.getParameterTypes();
    int i = 0;
    for (Type type : types) {
      if (i != 0) {
        System.out.print(", ");
      }
      System.out.print(type.getTypeName());
      i++;
    }
    
    System.out.println(");");
  }
}
```

# 0x05 使用及异常
在分析类时，可以在编程阶段直接指定要分析的对象，但这样在如果要分析其他类就要修改源代码，所以可以在程序运行过程中输入要分析的类，然后使用`Class.forName(String)`找到该类。若输入的类不存在，使用`Class.forName(String)`将会抛出一个`ClassNotFoundException`异常。   

# 0x06 测试及结果
下面是通过类分析程序分析java.lang.Double得到的结果，供参考使用。   

```text
public abstract class java.lang.Number implements java.io.Serializable {
	private static final java.lang.Number serialVersionUID;

	public java.lang.Number();

	public byte byteValue();
	public short shortValue();
	public abstract int intValue();
	public abstract long longValue();
	public abstract float floatValue();
	public abstract double doubleValue();
}
```

# 0x07 参考资料
1. Cay S. Horstmann and Gary Cornell. *Core Java Volume I -- Fundamentals, Ninth Edition*.   
2. Bruce Eckel. *Thinking in Java, Fourth Edition*.   
3. [Wikipedia - Reflection](https://en.wikipedia.org/wiki/Reflection_%28computer_programming%29)   
4. [Java Platform, Standard Edition 8. API Specification](https://docs.oracle.com/javase/8/docs/api/)   
