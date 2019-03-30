# AuroraScheme

![GitHub top language](https://img.shields.io/github/languages/top/mikukonai/AuroraScheme.svg) ![GitHub](https://img.shields.io/github/license/mikukonai/AuroraScheme.svg?label=Licence) 

Scheme语言实现（编译器+虚拟机） / A Scheme Implementation (Compiler & Virtual Machine)

由JavaScript实现，基于Node.js。

## 可视化演示

[调试工具（部分功能）](https://mikukonai.com/auroravm.html)

## 提交信息规范

使用前缀（标签）来提示本次提交的主要内容。同一个commit可以有多个标签，但是要按照以下顺序排列。

- 【开发】指实现或者试验性地实现新特性、新功能，是从无到有的工作。
- 【优化】针对现有代码的优化、重构，是从有到优的工作。
- 【修复】故障排查与修复。
- 【测试】新增、完善、改进测试用例和测试平台（testbench）。
- 【文档】指文档维护工作。

## 这是什么

AuroraVM 是一部 Scheme 虚拟机（语言实现），可以执行由 Scheme 代码编译得到的虚拟机指令码文件。

开发目标：

- 基于Node.js，实现一个结构完备、功能完整、基本可用的Scheme语言实现（运行时环境）。
- 完善基础库和应用库，使其可以处理一些简单的任务，并通过持续改进，打造成一门个人自用的趁手的工具性脚本语言。
- 作为个人自用，并**不打算完全严格遵守RxRS标准**，但是会努力对标R5RS。
- 学习目的：知行合一，验证目前所掌握的知识。

已实现的特性：

- 已打通 模块加载-分析-编译-执行机 流程。
- 基于栈的虚拟机。
- 支持头等的函数和续延（continuation）。
- 模块加载器（依赖关系与命名空间分析）。
- 基于标记-清除的垃圾回收。
- 运行时新建进程（fork），用于实现用户程序层次的多进程。
- 类似JNI的Native库函数机制，允许开发者使用JavaScript实现扩展库。【正在完善】
- 基于上一条特性，实现了若干Native库函数（String、HTTPS、Math、File等）。

近期工作和计划实现的特性：

- 高精度数值运算。
- 功能有限的准引用（quasiquote）。
- 字符串模板（类似于JavaScript的）和正则表达式。
- 进程调度器。
- 提升Native库机制的JS与Scheme的互操作性，以及接口的友好性。
- 完善基础库（nativelib）和应用库（applib），分别指利用ANI机制由JS编写的库，和直接使用Scheme编写的库。
- 可视化的调试工具。
- 自动化测试。

暂未列入计划的特性：

- 编译时类型检查、推导，或者强类型语言。
- 模式匹配。
- 卫生宏。
- 可以由卫生宏所实现的一系列结构，例如`let`块、`delay`/`force`、柯里化和CPST等等。

随着开发过程的推进，可能会增减特性。

## BNF

```
          <Term> ::= <SList> | <Lambda> | <Quote> | <Unquote> | <Quasiquote> | <Symbol>
         <SList> ::= ( <SListSeq> )
      <SListSeq> ::= <Term> <SListSeq> | ε
        <Lambda> ::= ( lambda <ArgList> <Body> )
       <ArgList> ::= ( <ArgListSeq> )
    <ArgListSeq> ::= <ArgSymbol> <ArgListSeq> | ε
     <ArgSymbol> ::= <Symbol>
          <Body> ::= <BodyTerm> <Body_>
         <Body_> ::= <BodyTerm> <Body_> | ε
      <BodyTerm> ::= <Term>
         <Quote> ::= ' <QuoteTerm>
       <Unquote> ::= , <UnquoteTerm>
    <Quasiquote> ::= ` <QuasiquoteTerm>
     <QuoteTerm> ::= <Term>
   <UnquoteTerm> ::= <Term>
<QuasiquoteTerm> ::= <Term>
        <Symbol> ::= SYMBOL
```

## 设计思想简述

- 本系统以“工程”为用户程序的单位，其中Scheme代码以源文件为单位进行组织，每个源文件称为“模块”。在同一工程中，任何模块的全限定名都是不相同的，因而模块的命名空间是独立的。模块间可以互相引用，形成依赖关系。
- 与Java类似，任何工程的构建都是从一个模块出发，根据依赖关系，编译、打包成一个可以独立运行的应用程序。
- 模块加载器会根据模块的路径，自动从文件系统中读取它及它依赖的所有模块的源代码。随后，对整个工程进行词法语法分析、编译，生成可供虚拟机直接执行的可执行模块。
- 可执行模块含有程序的静态对象和虚拟机指令。可执行模块可以被运行时模块读取，形成虚拟机进程加入进程池，根据调度策略，在某一时刻被执行机执行。
- 虚拟机进程拥有完全独立的存储空间。可以把虚拟机进程看成是一个状态的集合：执行机负责根据进程内部的格局和虚拟机内外的环境，修改进程内部的状态和虚拟机内外部的状态。
- 虚拟机进程空间分多个部分，其中堆区是最主要的部分。由于Scheme是函数式语言，因此无论是堆区还是池区均不能够被用户程序随意访问。堆区的空间分配和垃圾回收是自动的，用户程序不能控制，也无需关心。
- 虚拟机进程通过“端口”和“信号”两种机制对外通信。端口可视为对共享内存、文件系统、外设等外部资源的抽象。信号可理解为中断，通过虚拟机层面的中断机制，实现进程间、进程与虚拟机、进程与外部环境的（准）同步通信。
- 系统提供调试器，以可视化的方式对用户程序和虚拟机的运行格局进行观察。调试器采用B/S设计，服务端用于构造调试信息、接收调试指令、提供HTTP服务，客户端（网页）负责渲染可视化界面、收发用户的调试操作指令。

## 技术细节

参见《[虚拟机设计笔记](https://mikukonai.com/template.html?id=虚拟机设计笔记)》

## 权利声明

版权所有 &copy; 2019 Mikukonai@GitHub，保留所有权利。

采用 MIT 协议进行授权。

本系统为个人以学习和自用目的所创作的作品。作者不对此系统的质量作任何承诺，不保证提供任何形式的解释、维护或支持，也不为任何人使用此系统所造成的任何正面的或负面的后果负责。
