---
title: JSX 的本质是什么
permalink: react-JSX/
category: 中文
tags:
	- React
	- JSX
---

JSX（JavaScript XML）的本质是 JavaScript 的语法糖。

## React Compiler 详解
React Compiler 是 React 官方正在推进的编译优化方案。它的目标是把组件里“哪些地方会变、哪些地方不会变”的判断交给编译器完成，从而减少手写 `useMemo`、`useCallback`、`memo` 这类性能优化代码的必要性。

下面从“是什么、解决什么、怎么做、限制是什么、和现有优化手段的关系、如何迁移”几个角度来说明。

## 1. 它解决的核心问题
React 渲染是以“组件执行”作为基本单位的：父组件重新渲染时，子组件也会重新执行，React 再通过调和（reconciliation）判断哪些 DOM 真正需要更新。

为了避免不必要的组件执行，开发者会：
- 用 `React.memo` 包裹组件
- 用 `useMemo`/`useCallback` 固定对象/函数引用
- 手动拆分组件、抽离子树

这些优化有三个问题：
1) 需要手工维护依赖项，容易写错或过期  
2) 代码可读性降低，尤其是大量 `useMemo`/`useCallback`  
3) 优化是否生效难以肉眼判断，调试成本高  

React Compiler 希望把“依赖分析”和“是否需要重新计算”自动化，让组件保持自然的书写方式，同时获得接近手写优化的性能。

## 2. 编译器如何工作（核心机制）
React Compiler 的核心思想是：**对组件内部的表达式做静态分析，识别“稳定值”和“可能变化的值”，并生成缓存指令**。

可以理解为把下面这种手动优化：
```jsx
const list = useMemo(() => items.map(...), [items]);
```
自动化到编译阶段完成。

大致流程如下：
1) **解析组件**：把函数组件转换成 AST。  
2) **依赖追踪**：分析每个表达式依赖哪些变量。  
3) **稳定性判断**：区分常量、props、state、ref、函数等来源。  
4) **生成缓存点**：把可缓存的表达式生成“按依赖更新”的缓存槽。  
5) **输出优化后的组件**：在运行时用更少的重复计算。  

简单地说，编译器在帮你隐式生成 `useMemo`/`useCallback` 逻辑，但没有手写的心智负担。

## 3. 它能优化哪些场景
典型的收益点：
- **对象/数组字面量**：避免每次 render 都创建新引用  
- **内联函数**：减少子组件的无意义重新渲染  
- **复杂计算**：自动加缓存  
- **JSX 子树**：对稳定子树做缓存  

示意：
```jsx
function App({ items }) {
  const config = { mode: "grid" };
  const onClick = () => console.log(items.length);
  return <List items={items} config={config} onClick={onClick} />;
}
```

在现有写法里，`config` 和 `onClick` 每次 render 都是新引用，可能导致 `List` 重渲染。  
编译器会把它们缓存到依赖 `items` 的位置上，从而保持引用稳定。

## 4. 关键概念：可变性（Mutability）与稳定性（Stability）
React Compiler 最看重的是“某个值是否会改变引用/内容”。  
可大致分为几类：
- **常量/字面量**：稳定  
- **props/state**：可变  
- **从 props/state 派生的值**：视依赖而定  
- **ref.current**：可变但不触发渲染  
- **函数**：通常被视为新引用，需要缓存  

编译器的目标不是“避免渲染”，而是“避免无效的计算和对象创建”，以及由此带来的子组件不必要渲染。

## 5. 限制与注意事项
React Compiler 不是万能的，它依赖静态分析，有一些限制：
- **动态语言特性**（如 `eval`）会让分析失效  
- **隐式依赖**（如在 render 中读取全局可变对象）很难被正确追踪  
- **可变数据结构**（直接修改对象/数组）会打破缓存假设  
- **不纯的 render**（render 中有副作用）可能导致行为变化  

因此官方强调：组件应该尽量“纯”（pure），遵循不可变数据思想。

## 6. 和 React 现有优化手段的关系
React Compiler 的定位是“默认优化”。  
它不会取代所有手动优化，但会覆盖大量常见场景。

实际使用中可能出现：
- 大部分 `useMemo`/`useCallback` 可以移除  
- 少数高度定制的性能热点仍需要手工优化  
- `React.memo` 依然有用，但使用频率会降低  

## 7. 使用与迁移建议
如果你的项目将来启用 React Compiler：
1) **先保证代码是可预测的**：避免 render 中副作用  
2) **减少可变数据结构**：避免直接修改对象/数组  
3) **逐步移除手动 memo**：让编译器接管  
4) **配合性能分析工具**：用 Profiler 验证效果  

## 8. 一句话总结
React Compiler 的本质是：把“依赖追踪 + memo 化”放到编译期完成，让你写更朴素的 React 代码，同时自动获得更好的性能。

它允许开发者在 JS 代码中书写类似 HTML 的标签结构，其核心目的是通过声明式语法描述 UI 结构，从而提高开发效率和代码可读性。 

在 React 的底层处理中，JSX 最终会被转换为普通的 JavaScript 函数调用，这些调用会返回一个名为 React Element 的纯 JavaScript 对象（即虚拟 DOM），用于描述你希望在屏幕上看到的内容。 

## 编译后的产物

在旧版 React 或未开启新转换配置的项目中，JSX 会被编译为 React.createElement。 

随着 React 版本的演进，编译产物主要分为两种形式。到 2026 年，绝大多数现代项目均已采用“新转换模式”。

形式 A：新版转换（React 17+ 及 React 19 后的主流）
自 React 17 起，编译器（如 Babel 或 SWC）不再将 JSX 转换为 React.createElement。相反，它会从 react/jsx-runtime 引入特殊的转换函数。 

无需在文件顶部手动显式 import React from 'react' 即可使用 JSX。 

## React Compiler

进入 2026 年，React 官方的 React Compiler 已在生产环境中广泛应用。这使得编译后的产物不仅是简单的函数调用，还包含了自动记忆化（Auto-memoization）的代码。 
