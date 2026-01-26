---
title: React 自定义 Hook 设计原则
permalink: react-customize-hooks/
date: 2026-01-26 18:40:00
tags: 
- React
- Hooks
- 架构设计
categories: 中文
---

自定义 Hook 的设计原则是什么？什么逻辑适合抽成 Hook？从工程实践角度深入探讨 Hook 设计背后的思考模型。

<!-- more -->

## 1. 为什么我们需要"设计良好"的自定义 Hook

在大型 React 项目中，糟糕的 Hook 设计会带来严重后果：

- **维护成本激增**：逻辑散落各处，修改一处影响多处
- **性能问题难排查**：过度渲染、内存泄漏隐藏在封装之下
- **团队协作困难**：Hook 职责不清，参数返回值不直观
- **测试复杂度倍增**：副作用耦合，难以隔离测试

设计良好的 Hook 应该像一个精心设计的 API：

```typescript
// 好的设计：职责清晰，接口稳定
const { data, loading, error, refetch } = useFetch('/api/users');

// 糟糕的设计：职责不清，返回值混乱
const [data, setData, loading, error, fetchAgain, cancel, retry] = useData('/api/users');
```

**核心观点**：Hook 不是为了"少写几行代码"，而是为了**隔离关注点、提升可维护性**。

---

## 2. 自定义 Hook 的本质：逻辑抽象，而不是代码复用

### 2.1 常见误区

很多开发者将 Hook 视为"代码复用工具"，这是一个本末倒置的认知：

```typescript
// ❌ 错误认知：为了复用而抽 Hook
function useButtonHandler() {
  const handleClick = () => console.log('clicked');
  return handleClick;
}

// ✅ 正确认知：为了抽象逻辑而设计 Hook
function useAsyncOperation<T>(asyncFn: () => Promise<T>) {
  const [state, setState] = useState({ loading: false, data: null, error: null });
  
  const execute = useCallback(async () => {
    setState({ loading: true, data: null, error: null });
    try {
      const data = await asyncFn();
      setState({ loading: false, data, error: null });
    } catch (error) {
      setState({ loading: false, data: null, error });
    }
  }, [asyncFn]);
  
  return { ...state, execute };
}
```

### 2.2 逻辑抽象的三个层次

1. **状态封装**：将状态及其变更逻辑封装在一起
2. **副作用隔离**：将副作用与组件逻辑解耦
3. **业务模型抽象**：将业务逻辑抽象为可复用的问题模型

```typescript
// 层次 1：状态封装
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle] as const;
}

// 层次 2：副作用隔离
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// 层次 3：业务模型抽象
function usePagination<T>(fetchFn: (page: number) => Promise<T[]>) {
  const [page, setPage] = useState(1);
  const { data, loading, error, execute } = useAsyncOperation(
    () => fetchFn(page)
  );
  
  useEffect(() => {
    execute();
  }, [page, execute]);
  
  return {
    data,
    loading,
    error,
    page,
    nextPage: () => setPage(p => p + 1),
    prevPage: () => setPage(p => Math.max(1, p - 1)),
  };
}
```

---

## 3. Hook 的设计原则（工程级）

### 3.1 单一职责原则

每个 Hook 应该只做一件事，且做好这一件事。

```typescript
// ❌ 违反单一职责：一个 Hook 做太多事
function useUserProfile() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState([]);
  // ... 100 行逻辑
}

// ✅ 符合单一职责：分离关注点
function useUser() {
  const [user, setUser] = useState(null);
  // 只处理用户数据
}

function useUserPosts(userId: string) {
  // 只处理用户文章
}

function useTheme() {
  // 只处理主题
}
```

**判断标准**：Hook 的名字是否能用一个动词或名词准确描述？如果需要用"和"连接多个动词，说明职责不单一。

### 3.2 可组合性

Hook 应该可以像乐高积木一样组合使用。

```typescript
// 底层 Hook：可复用的基础逻辑
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });
  
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  
  return [value, setValue] as const;
}

// 中层 Hook：组合基础 Hook
function useAuth() {
  const [token, setToken] = useLocalStorage('auth_token', null);
  const [user, setUser] = useLocalStorage('user', null);
  
  const login = useCallback(async (credentials) => {
    const { token, user } = await api.login(credentials);
    setToken(token);
    setUser(user);
  }, [setToken, setUser]);
  
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, [setToken, setUser]);
  
  return { token, user, login, logout };
}

// 高层 Hook：组合中层 Hook
function useProtectedRoute() {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);
}
```

**设计建议**：先设计小而专注的 Hook，再通过组合构建复杂功能。

### 3.3 稳定性（引用、返回值）

Hook 返回的函数和对象引用应该保持稳定，避免触发不必要的重渲染。

```typescript
// ❌ 不稳定：每次渲染都创建新对象
function useBadCounter() {
  const [count, setCount] = useState(0);
  return {
    count,
    increment: () => setCount(c => c + 1), // 每次渲染新函数
    decrement: () => setCount(c => c - 1), // 每次渲染新函数
  };
}

// ✅ 稳定：使用 useCallback 缓存函数
function useGoodCounter() {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  
  return { count, increment, decrement };
}

// ✅ 更好：使用 useMemo 缓存对象
function useBetterCounter() {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  
  return useMemo(
    () => ({ count, increment, decrement }),
    [count, increment, decrement]
  );
}
```

**核心原则**：如果 Hook 返回的值会被用作其他 Hook 的依赖，必须保证引用稳定。

### 3.4 边界清晰

Hook 的职责边界和副作用范围应该清晰明确。

```typescript
// ❌ 边界不清：Hook 内部修改外部状态
function useBadForm(externalState: any) {
  const [value, setValue] = useState('');
  
  useEffect(() => {
    externalState.formData = value; // 修改外部状态！
  }, [value]);
  
  return [value, setValue];
}

// ✅ 边界清晰：通过回调通知外部
function useGoodForm(onValueChange?: (value: string) => void) {
  const [value, setValue] = useState('');
  
  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    onValueChange?.(newValue);
  }, [onValueChange]);
  
  return [value, handleChange] as const;
}
```

**设计规范**：
- Hook 内部状态自己管理
- 外部状态通过参数传入、通过回调传出
- 不要让 Hook "伸手"去改外部状态

### 3.5 参数与返回值设计哲学

#### 参数设计

```typescript
// ❌ 参数过多，难以记忆
function useFetch(
  url: string,
  method: string,
  headers: object,
  body: any,
  retry: number,
  timeout: number,
  onSuccess: Function,
  onError: Function
) { }

// ✅ 使用配置对象，支持可选参数
function useFetch<T>(url: string, options?: {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  retry?: number;
  timeout?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}) { }
```

**参数设计原则**：
1. 必需参数放前面，可选参数放后面
2. 超过 3 个参数考虑使用配置对象
3. 提供合理的默认值
4. 使用 TypeScript 类型约束

#### 返回值设计

```typescript
// ❌ 数组返回值：顺序重要，语义不清
function useBadFetch(url: string) {
  return [data, loading, error, refetch, cancel];
}

// ✅ 对象返回值：语义清晰，解构灵活
function useGoodFetch<T>(url: string) {
  return {
    data: T | null,
    loading: boolean,
    error: Error | null,
    refetch: () => void,
    cancel: () => void,
  };
}

// ✅ 元组返回值：适用于简单的"值+setter"模式
function useToggle(initial = false) {
  return [value, toggle] as const; // 模仿 useState
}
```

**返回值选择规则**：
- 2 个值以内：数组（模仿 useState 风格）
- 3 个值以上：对象（语义更清晰）
- 同类数据：对象包裹（如 `{ data, loading, error }`）

### 3.6 依赖管理

依赖数组是 Hook 设计中最容易出错的地方。

```typescript
// ❌ 依赖遗漏：导致闭包陷阱
function useBadInterval(callback: () => void, delay: number) {
  useEffect(() => {
    const id = setInterval(callback, delay);
    return () => clearInterval(id);
  }, [delay]); // 缺少 callback！
}

// ✅ 使用 ref 存储最新回调
function useGoodInterval(callback: () => void, delay: number) {
  const savedCallback = useRef(callback);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// ✅ 明确依赖策略
function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]); // 依赖清晰明确
  
  return debouncedValue;
}
```

**依赖管理原则**：
1. 不要忽略 ESLint 的 exhaustive-deps 警告
2. 对于回调函数，考虑使用 ref 存储最新值
3. 对于复杂对象，考虑使用 useMemo 稳定引用
4. 明确每个依赖的作用和变化时机

---

## 4. 抽象边界：什么该进 Hook，什么不该

### 4.1 适合抽成 Hook 的场景

#### ✅ 场景 1：有状态的业务逻辑

```typescript
// 表单验证逻辑：有状态+有副作用
function useFormValidation<T>(initialValues: T, rules: ValidationRules<T>) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  
  const validate = useCallback((fieldName: keyof T) => {
    const rule = rules[fieldName];
    const error = rule ? rule(values[fieldName]) : null;
    setErrors(prev => ({ ...prev, [fieldName]: error }));
    return !error;
  }, [values, rules]);
  
  // ... 更多逻辑
  
  return { values, errors, touched, setValues, validate };
}
```

#### ✅ 场景 2：副作用封装

```typescript
// 事件监听：需要清理的副作用
function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: HTMLElement | Window = window
) {
  const savedHandler = useRef(handler);
  
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);
  
  useEffect(() => {
    const eventListener = (event: Event) => savedHandler.current(event as WindowEventMap[K]);
    element.addEventListener(eventName, eventListener);
    return () => element.removeEventListener(eventName, eventListener);
  }, [eventName, element]);
}
```

#### ✅ 场景 3：复杂的派生状态

```typescript
// 购物车计算：复杂的派生逻辑
function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  
  const summary = useMemo(() => ({
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    tax: items.reduce((sum, item) => sum + item.price * item.quantity * 0.1, 0),
  }), [items]);
  
  const addItem = useCallback((item: CartItem) => {
    setItems(prev => [...prev, item]);
  }, []);
  
  return { items, summary, addItem };
}
```

### 4.2 不适合抽成 Hook 的场景

#### ❌ 场景 1：纯函数计算

```typescript
// ❌ 不要为纯函数设计 Hook
function useFormatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

// ✅ 直接用普通函数
function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}
```

#### ❌ 场景 2：一次性的简单操作

```typescript
// ❌ 过度封装
function useButtonClick(callback: () => void) {
  return () => callback();
}

// ✅ 直接在组件中写
<button onClick={handleClick}>Click</button>
```

#### ❌ 场景 3：强耦合的 UI 逻辑

```typescript
// ❌ UI 布局逻辑不应该进 Hook
function useModalLayout() {
  return {
    modalStyle: { position: 'fixed', top: '50%' },
    overlayStyle: { background: 'rgba(0,0,0,0.5)' },
  };
}

// ✅ UI 样式应该在组件或样式文件中
```

### 4.3 判断标准

使用"四问法"判断是否应该抽 Hook：

1. **是否有状态？** 如果只是纯函数计算，不需要 Hook
2. **是否有副作用？** 如果没有订阅/清理/DOM 操作，可能不需要 Hook
3. **是否需要复用？** 如果只用一次，先在组件内实现
4. **是否逻辑独立？** 如果与具体 UI 强耦合，不适合抽 Hook

---

## 5. 常见 Hook 设计模式及其背后的问题模型

### 5.1 异步状态管理模式

**问题模型**：异步操作有三种状态（loading/success/error），需要统一处理。

```typescript
function useAsync<T>(asyncFunction: () => Promise<T>, immediate = true) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const execute = useCallback(async () => {
    setStatus('loading');
    setData(null);
    setError(null);
    
    try {
      const response = await asyncFunction();
      setData(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error as Error);
      setStatus('error');
      throw error;
    }
  }, [asyncFunction]);
  
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);
  
  return { execute, status, data, error };
}
```

**适用场景**：API 调用、数据加载、表单提交

### 5.2 订阅-清理模式

**问题模型**：需要订阅外部数据源，并在组件卸载时清理。

```typescript
function useWebSocket(url: string) {
  const [data, setData] = useState(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const ws = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    ws.current = new WebSocket(url);
    
    ws.current.onopen = () => setReadyState(WebSocket.OPEN);
    ws.current.onclose = () => setReadyState(WebSocket.CLOSED);
    ws.current.onmessage = (event) => setData(JSON.parse(event.data));
    
    return () => {
      ws.current?.close();
    };
  }, [url]);
  
  const send = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);
  
  return { data, readyState, send };
}
```

**适用场景**：WebSocket、EventSource、定时器、事件监听

### 5.3 防抖/节流模式

**问题模型**：限制函数调用频率，避免性能问题。

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}
```

**适用场景**：搜索输入、滚动事件、窗口 resize

### 5.4 本地存储同步模式

**问题模型**：将状态持久化到 localStorage，并在多标签页间同步。

```typescript
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);
  
  // 监听其他标签页的变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);
  
  return [storedValue, setValue] as const;
}
```

**适用场景**：用户偏好、主题设置、表单草稿

### 5.5 生命周期模式

**问题模型**：在特定生命周期执行操作。

```typescript
// 组件挂载时执行一次
function useMount(callback: () => void) {
  useEffect(() => {
    callback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// 组件卸载时执行
function useUnmount(callback: () => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  
  useEffect(() => {
    return () => callbackRef.current();
  }, []);
}

// 前一次的值
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}
```

**适用场景**：数据预加载、分析上报、资源清理

---

## 6. 工程实践中的坑与代价

### 6.1 闭包陷阱

**问题描述**：useEffect/useCallback 中访问到的是旧的闭包变量。

```typescript
// ❌ 闭包陷阱示例
function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count); // 永远是 0！
      setCount(count + 1); // 永远是 0 + 1 = 1
    }, 1000);
    
    return () => clearInterval(timer);
  }, []); // 空依赖数组导致 count 永远是初始值
  
  return <div>{count}</div>;
}

// ✅ 解决方案 1：使用函数式更新
function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => c + 1); // 使用函数式更新
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return <div>{count}</div>;
}

// ✅ 解决方案 2：使用 ref 存储最新值
function Counter() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  
  useEffect(() => {
    countRef.current = count;
  }, [count]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      console.log(countRef.current); // 访问最新值
      setCount(countRef.current + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return <div>{count}</div>;
}
```

**最佳实践**：
- 优先使用函数式更新 `setState(prev => ...)`
- 需要访问多个状态时使用 `useReducer`
- 对于回调函数使用 ref 存储最新值

### 6.2 依赖数组陷阱

**问题描述**：依赖数组管理不当导致无限循环或状态不同步。

```typescript
// ❌ 对象/数组依赖导致无限循环
function useBadEffect() {
  const [count, setCount] = useState(0);
  const config = { url: '/api/data' }; // 每次渲染都是新对象
  
  useEffect(() => {
    fetch(config.url).then(/* ... */);
  }, [config]); // config 每次都变化，导致无限请求！
}

// ✅ 解决方案 1：使用 useMemo 稳定引用
function useGoodEffect() {
  const [count, setCount] = useState(0);
  const config = useMemo(() => ({ url: '/api/data' }), []); // 稳定引用
  
  useEffect(() => {
    fetch(config.url).then(/* ... */);
  }, [config]);
}

// ✅ 解决方案 2：直接使用原始值
function useBetterEffect() {
  const [count, setCount] = useState(0);
  const url = '/api/data'; // 原始值天然稳定
  
  useEffect(() => {
    fetch(url).then(/* ... */);
  }, [url]);
}

// ❌ 缺失依赖导致状态不同步
function SearchBox({ onSearch }: { onSearch: (keyword: string) => void }) {
  const [keyword, setKeyword] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(keyword);
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword]); // 缺少 onSearch 依赖！
}

// ✅ 完整依赖 + 稳定 onSearch
function SearchBox({ onSearch }: { onSearch: (keyword: string) => void }) {
  const [keyword, setKeyword] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(keyword);
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword, onSearch]); // 完整依赖
}

// 父组件需要用 useCallback 稳定 onSearch
function Parent() {
  const handleSearch = useCallback((keyword: string) => {
    console.log('Search:', keyword);
  }, []);
  
  return <SearchBox onSearch={handleSearch} />;
}
```

**最佳实践**：
- 开启 ESLint `react-hooks/exhaustive-deps` 规则
- 对象/数组依赖用 `useMemo` 稳定
- 函数依赖用 `useCallback` 稳定
- 考虑使用 `useReducer` 替代多个 `useState`

### 6.3 过度封装陷阱

**问题描述**：为了"代码复用"而过度抽象，导致难以理解和维护。

```typescript
// ❌ 过度封装：Hook 套 Hook，逻辑难以追踪
function useDataWithCacheAndRetryAndPagination<T>(
  url: string,
  options: ComplexOptions
) {
  const cache = useCache();
  const retry = useRetry(options.retryConfig);
  const pagination = usePagination(options.page);
  const fetcher = useFetcher(url, { cache, retry, pagination });
  const transformer = useDataTransformer(options.transform);
  const validator = useDataValidator(options.validate);
  
  // ... 200 行逻辑
  
  return {
    data: transformer(validator(fetcher.data)),
    // ... 20 个返回值
  };
}

// ✅ 适度封装：分层设计，每层职责清晰
// 底层：基础 Hook
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // 简单清晰的逻辑
}

// 中层：组合 Hook（按需使用）
function useFetchWithCache<T>(url: string) {
  const { data, loading, error } = useFetch<T>(url);
  const { get, set } = useCache();
  
  // 缓存逻辑
}

// 高层：业务 Hook（在组件中按需组合）
function UserProfile() {
  const { data: user } = useFetch('/api/user');
  const { cache } = useCache();
  // 组件自己决定如何组合
}
```

**最佳实践**：
- 遵循"最小可用原则"：先简单实现，有复用需求再抽象
- 分层设计：底层通用 Hook + 中层组合 Hook + 高层业务 Hook
- 避免"万能 Hook"：一个 Hook 不应该有超过 5 个参数或 10 个返回值

### 6.4 性能陷阱

**问题描述**：Hook 设计不当导致性能问题。

```typescript
// ❌ 性能陷阱 1：每次渲染都创建新对象
function useUserData() {
  const [user, setUser] = useState(null);
  
  return {
    user,
    updateName: (name: string) => setUser({ ...user, name }), // 每次新函数
    updateAge: (age: number) => setUser({ ...user, age }),    // 每次新函数
  };
}

// 子组件每次都重新渲染
const UserProfile = memo(({ updateName }) => {
  // updateName 每次都是新引用，memo 失效！
});

// ✅ 使用 useCallback 优化
function useUserData() {
  const [user, setUser] = useState(null);
  
  const updateName = useCallback((name: string) => {
    setUser(prev => ({ ...prev, name }));
  }, []);
  
  const updateAge = useCallback((age: number) => {
    setUser(prev => ({ ...prev, age }));
  }, []);
  
  return useMemo(
    () => ({ user, updateName, updateAge }),
    [user, updateName, updateAge]
  );
}

// ❌ 性能陷阱 2：不必要的依赖导致重复计算
function useExpensiveComputation(data: any[]) {
  const result = useMemo(() => {
    return data.map(item => {
      // 昂贵的计算
      return complexTransform(item);
    });
  }, [data]); // data 是新数组引用时，每次都重算
  
  return result;
}

// ✅ 使用更稳定的依赖
function useExpensiveComputation(data: any[]) {
  const dataIds = data.map(d => d.id).join(','); // 稳定的字符串
  
  const result = useMemo(() => {
    return data.map(item => complexTransform(item));
  }, [dataIds]); // 只有 id 列表变化时才重算
  
  return result;
}

// ❌ 性能陷阱 3：过度使用 useEffect 导致级联更新
function BadComponent() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  
  useEffect(() => { setB(a * 2); }, [a]);       // 1 次渲染
  useEffect(() => { setC(b + 10); }, [b]);      // 2 次渲染
  useEffect(() => { doSomething(c); }, [c]);    // 3 次渲染
}

// ✅ 使用派生状态减少渲染
function GoodComponent() {
  const [a, setA] = useState(0);
  const b = a * 2;              // 派生值，不触发渲染
  const c = b + 10;             // 派生值，不触发渲染
  
  useEffect(() => {
    doSomething(c);
  }, [c]);                      // 只有 1 次额外渲染
}
```

**最佳实践**：
- 返回的函数/对象使用 `useCallback`/`useMemo` 缓存
- 优先使用派生状态（普通变量）而不是 `useEffect` + `setState`
- 使用 React DevTools Profiler 检测性能问题
- 对于复杂状态逻辑考虑使用 `useReducer`

### 6.5 测试陷阱

**问题描述**：Hook 难以测试，特别是有副作用的 Hook。

```typescript
// ❌ 难以测试：逻辑与副作用耦合
function useBadAuth() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // 直接调用全局 API
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(setUser);
  }, []);
  
  const login = async (credentials: any) => {
    // 直接调用全局 API
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const user = await res.json();
    setUser(user);
  };
  
  return { user, login };
}

// ✅ 易于测试：依赖注入
function useGoodAuth(authService = defaultAuthService) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    authService.getMe().then(setUser);
  }, [authService]);
  
  const login = useCallback(async (credentials: any) => {
    const user = await authService.login(credentials);
    setUser(user);
  }, [authService]);
  
  return { user, login };
}

// 测试时可以注入 mock service
test('useAuth login', async () => {
  const mockService = {
    getMe: jest.fn(),
    login: jest.fn().mockResolvedValue({ id: 1, name: 'Test' }),
  };
  
  const { result } = renderHook(() => useGoodAuth(mockService));
  
  await act(async () => {
    await result.current.login({ username: 'test' });
  });
  
  expect(result.current.user).toEqual({ id: 1, name: 'Test' });
});
```

**最佳实践**：
- 使用依赖注入，避免直接依赖全局变量
- 将副作用隔离到独立的函数中
- 使用 `@testing-library/react-hooks` 测试 Hook
- 对于复杂 Hook，编写集成测试而不是单元测试

---

## 7. 总结：Hook 设计 = 架构设计的微缩版

### 7.1 核心思想对照

| 软件架构原则 | Hook 设计体现 |
|------------|-------------|
| 单一职责原则 (SRP) | 每个 Hook 只做一件事 |
| 开闭原则 (OCP) | 通过组合扩展，而不是修改 Hook 内部 |
| 依赖倒置原则 (DIP) | 依赖注入，而不是硬编码依赖 |
| 接口隔离原则 (ISP) | 返回最小必要接口，不返回无关数据 |
| 最少知识原则 | Hook 不应该"伸手"修改外部状态 |

### 7.2 设计检查清单

在完成一个自定义 Hook 后，问自己这些问题：

- [ ] **职责是否单一？** Hook 名字能否用一个动词/名词描述？
- [ ] **接口是否清晰？** 参数和返回值是否语义明确？
- [ ] **引用是否稳定？** 返回的函数/对象是否使用了 useCallback/useMemo？
- [ ] **依赖是否完整？** useEffect/useCallback 的依赖数组是否完整？
- [ ] **边界是否清晰？** Hook 是否只管理自己的状态，不修改外部状态？
- [ ] **是否可测试？** 是否可以通过依赖注入进行单元测试？
- [ ] **是否可组合？** 是否可以与其他 Hook 组合使用？
- [ ] **性能是否合理？** 是否会导致不必要的重渲染或重复计算？

### 7.3 从 Hook 设计到系统设计

优秀的 Hook 设计者往往也是优秀的系统架构师，因为他们理解：

1. **抽象的价值**：不是为了少写代码，而是为了隔离关注点
2. **边界的重要性**：清晰的边界让系统更易维护
3. **组合的力量**：小而专注的模块通过组合产生强大功能
4. **权衡的艺术**：没有完美的设计，只有适合场景的设计

**最后的建议**：

- 先在组件中实现功能，确认逻辑可行后再抽 Hook
- 遵循"Rule of Three"：同样的逻辑出现 3 次再考虑抽象
- 优先组合而非继承：使用小 Hook 组合，而非大而全的 Hook
- 持续重构：随着理解深入，不断优化 Hook 设计

---

## 参考资源

- [React 官方文档 - Hook 规则](https://react.dev/reference/rules)
- [useHooks - 常用 Hook 集合](https://usehooks.com/)
- [ahooks - 企业级 React Hooks 库](https://ahooks.js.org/)
- [Testing React Hooks - Kent C. Dodds](https://kentcdodds.com/blog/how-to-test-custom-react-hooks)
