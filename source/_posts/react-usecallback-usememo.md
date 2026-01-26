---
title: React 中 useCallback 和 useMemo 的区别与使用场景
permalink: react-usecallback-usememo/
date: 2026-01-26 18:33:52
tags: 
- React
categories: 中文
---
在 React 中，`useCallback` 和 `useMemo` 的**核心目的都是缓存（memoization）**，减少不必要的重新创建和重新计算，从而避免不必要的子组件重渲染或昂贵计算。但它们**缓存的东西不同**。

<!-- more -->

一句话总结：

> **useCallback 缓存函数，useMemo 缓存计算结果。**

---

## 一、定义层面的区别

### 1️⃣ useCallback

```ts
const fn = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

等价于：

```ts
const fn = useMemo(() => {
  return () => {
    doSomething(a, b);
  };
}, [a, b]);
```

**作用：**

* 缓存的是：**函数引用本身**
* 只要依赖不变，函数地址不变
* 主要用于：**防止子组件因为 props 中函数引用变化而重复渲染**

---

### 2️⃣ useMemo

```ts
const value = useMemo(() => {
  return heavyCompute(a, b);
}, [a, b]);
```

**作用：**

* 缓存的是：**计算结果（值）**
* 只有依赖变化时，才会重新执行计算
* 主要用于：**避免昂贵计算在每次 render 时重复执行**

---

## 二、解决的问题本质不同

| Hook        | 解决什么问题           | 缓存什么 |
| ----------- | ---------------- | ---- |
| useCallback | 函数引用不稳定导致子组件重复渲染 | 函数   |
| useMemo     | 计算结果重复计算，性能浪费    | 值    |

---

## 三、典型使用场景

---

### 场景 1：传函数给 memo 子组件

React.memo 用于缓存函数组件的渲染结果，当 props 浅比较不变时，跳过重新渲染，常用于配合 useCallback / useMemo 避免无意义刷新。

```tsx
// React.memo = 给函数组件加一层“缓存壳子”，props 不变就不重新 render。
const Child = React.memo(({ onClick }) => {
  console.log("Child render");
  return <button onClick={onClick}>Click</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return <Child onClick={handleClick} />;
}
```

❌ 不用 useCallback：每次 Parent render，函数都是新对象 → Child 重渲染
✅ 用 useCallback：函数引用稳定 → Child 不会无意义刷新

---

### 场景 2：昂贵计算

**❌ 不使用 useMemo：**

```ts
function DataList({ type }) {
  const [count, setCount] = useState(0);
  const bigList = Array(10000).fill(0).map((_, i) => ({ 
    id: i, 
    type: i % 3 
  }));

  // 每次 render 都会执行 filter，即使 type 没变
  const filteredList = bigList.filter(x => x.type === type);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <p>Filtered: {filteredList.length} items</p>
    </div>
  );
}
// 问题：点击按钮时，filter 会重新执行，造成性能浪费
```

**✅ 使用 useMemo 优化：**

```ts
function DataList({ type }) {
  const [count, setCount] = useState(0);
  const bigList = useMemo(() => 
    Array(10000).fill(0).map((_, i) => ({ id: i, type: i % 3 })),
    []
  );

  // 只有 bigList 或 type 变化时才重新计算
  const filteredList = useMemo(() => {
    console.log('Filtering...'); // 用于验证是否重新计算
    return bigList.filter(x => x.type === type);
  }, [bigList, type]);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <p>Filtered: {filteredList.length} items</p>
    </div>
  );
}
// 优化：点击按钮时，filter 不会重新执行
```

**效果对比：**
- ❌ 不用 useMemo：每次 render 都执行昂贵计算，浪费性能
- ✅ 用 useMemo：只在依赖变化时重新计算，提升性能

---

## 四、常见误区

### ❌ 误区 1：滥用 useCallback / useMemo

> 它们不是“性能银弹”。

* 本身也有成本（依赖比较 + 闭包）
* 小函数 / 小计算用它们可能**更慢**

---

### ❌ 误区 2：useCallback 会阻止函数内部执行？

不是。

> useCallback 只保证**函数引用不变**，不是“函数不执行”。

---

### ❌ 误区 3：useMemo = 性能优化必用

不对。

> 只有在：

* 计算很重
* 或用于 memo 子组件的 props 对比
  才值得用。

---

## 五、工程实践判断标准

可以用这三条判断：

1. **这个值 / 函数是否会传给 `React.memo` 子组件？**
   - 如果是，用 `useCallback`（函数）或 `useMemo`（对象/数组）保持引用稳定
   - 避免子组件因 props 引用变化而无意义重渲染

2. **这个计算是否明显昂贵？**
   - 例如：filter 大数组（>1000 项）、复杂排序、图形计算、正则匹配
   - 如果是，用 `useMemo` 缓存结果

3. **这个对象/函数/数组是否会作为 `useEffect` / `useCallback` / `useMemo` 的依赖？**
   - 如果是，用 `useMemo` 或 `useCallback` 稳定引用
   - 避免因引用变化导致 effect 重复执行或依赖链连锁更新
   - 示例：
     ```ts
     const options = useMemo(() => ({ id: userId }), [userId]);
     
     useEffect(() => {
       fetchData(options); // options 引用稳定，避免重复请求
     }, [options]);
     ```

满足任意一条 → 值得用 memo / callback

---

## 六、快速决策与面试总结

### 一句话决策

| 你要干嘛   | 用什么         |
| ------ | ----------- |
| 稳定函数引用 | useCallback |
| 缓存计算结果 | useMemo     |
| 两者都不是  | 都别用         |

### 面试核心回答

> useCallback 是 useMemo 的语法糖，用来缓存函数引用；useMemo 用来缓存计算结果。两者都是为了解决引用不稳定或重复计算导致的性能问题，但应当只在必要时使用。

### 常见追问及答案

**Q1: useCallback 和 useMemo 有性能开销吗？**
> A: 有。每次 render 时都需要：① 比较依赖数组；② 维护闭包。所以不要滥用，只在真正有性能问题时使用。

**Q2: 什么时候不应该用它们？**
> A: ① 简单的原始值计算（如 `a + b`）；② 不会传给子组件的普通函数；③ 组件 render 本身就很快的情况。

**Q3: 如何判断是否需要优化？**
> A: 使用 React DevTools Profiler 测量组件渲染时间，只在确认有性能瓶颈时才优化。过早优化是万恶之源。

**Q4: useCallback 的依赖数组为空和非空有什么区别？**
> A: 
> - 空数组 `[]`：函数只在组件首次渲染时创建，之后永远不变
> - 非空 `[a, b]`：当 a 或 b 变化时，函数会重新创建
> - 不传依赖：每次 render 都创建新函数（失去了 useCallback 的意义）
