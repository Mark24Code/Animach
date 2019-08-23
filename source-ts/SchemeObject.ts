
// SchemeObjects.ts
// 内存管理和对象定义

type Handle = string;

class HashMap<DummyHandle, V> extends Object{
    public set(handle: Handle, value: V): void {
        this[handle] = value;
    }
    public get(handle: Handle): V{
        return this[handle];
    }
    public has(handle: Handle): boolean {
        return (handle in this);
    }
}

// Memory的元数据数据结构
interface Metadata {
    static: boolean,
    readOnly: boolean,
    status: string, // allocated modified free ...
    referrer: Array<Handle|void>
}

// 基于HashMap的对象存储区，用于实现pool、heap等
class Memory {
    // 数据Map
    public data: HashMap<Handle, any>;
    // 元数据Map（[静态标记,只读标记,使用状态标记,[主引对象把柄]]）
    public metadata: HashMap<Handle, Metadata>;
    // 自增的计数器，用于生成把柄
    public handleCounter: number;

    constructor() {
        this.data = new HashMap();
        this.metadata = new HashMap();
        this.handleCounter = 0;
    }

    // 动态分配堆对象把柄
    public NewHandle(typeTag: string, referrer: Handle|void): Handle {
        typeTag = typeTag || "OBJECT";
        let handle = `&${typeTag}_${this.handleCounter}`;
        this.data.set(handle, null);
        this.metadata.set(handle, {
            static: false,
            readOnly: false,
            status: 'allocated',
            referrer: [referrer]
        });
        this.handleCounter++;
        return handle;
    }

    // 动态回收堆对象把柄：删除堆中相应位置
    public DeleteHandle (handle: Handle): void {
        this.data.set(handle, undefined);
        this.metadata.set(handle, {
            static: false,
            readOnly: false,
            status: 'free',
            referrer: null
        });
    }

    // 根据把柄获取对象
    public Get(handle: Handle): any {
        if(this.data.has(handle)) {
            return this.data.get(handle);
        }
        else {
            throw `[Memory.Get] 空把柄:${handle}`;
        }
    }

    // 设置把柄的对象值
    public Set(handle: Handle, value: any): void {
        let metadata = this.metadata.get(handle);
        if(this.data.has(handle) === false) {
            throw `[Memory.Set] 未分配的把柄:${handle}`;
        }
        else if(metadata.readOnly) {
            throw `[Memory.Set] 不允许修改只读对象:${handle}`;
        }
        else if(metadata.static) {
            console.warn(`[Memory.Set] 修改了静态对象:${handle}`);
        }
        else {
            metadata.status = 'modified';
            this.metadata.set(handle, metadata);
            this.data.set(handle, value);
        }
    }
}

class SchemeObject {
    public type: SchemeObjectType;
}

enum SchemeObjectType {
    STRING        = "STRING",
    // SYMBOL     = "SYMBOL",
    // NUMBER     = "NUMBER",
    // BOOLEAN    = "BOOLEAN",
    LIST          = "LIST",
      LAMBDA      = "LAMBDA",
      APPLICATION = "APPLICATION",
      QUOTE       = "QUOTE",
      QUASIQUOTE  = "QUASIQUOTE",
      UNQUOTE     = "UNQUOTE"
}

// 各种具体对象

// Application列表对象
class ApplicationObject extends SchemeObject {
    public parent: Handle;
    public children: Array<any>;

    constructor(parent: Handle) {
        super();
        this.type = SchemeObjectType.APPLICATION;
        this.parent = parent;
        this.children = new Array<any>();
    }
}

// Quote列表对象
class QuoteObject extends SchemeObject {
    public parent: Handle;
    public children: Array<any>;

    constructor(parent: Handle) {
        super();
        this.type = SchemeObjectType.QUOTE;
        this.parent = parent;
        this.children = new Array<any>();
        this.children[0] = "quote";
    }
}

// Quasiquote列表对象
class QuasiquoteObject extends SchemeObject {
    public parent: Handle;
    public children: Array<any>;

    constructor(parent: Handle) {
        super();
        this.type = SchemeObjectType.QUASIQUOTE;
        this.parent = parent;
        this.children = new Array<any>();
        this.children[0] = "quasiquote";
    }
}

// Unquote列表对象
class UnquoteObject extends SchemeObject {
    public parent: Handle;
    public children: Array<any>;

    constructor(parent: Handle) {
        super();
        this.type = SchemeObjectType.UNQUOTE;
        this.parent = parent;
        this.children = new Array<any>();
        this.children[0] = "unquote";
    }
}

// Lambda列表对象
// [lambda, [param0, ... ], body0, ...]
class LambdaObject extends SchemeObject {
    public parent: Handle;
    public children: Array<any>;

    constructor(parent: Handle) {
        super();
        this.type = SchemeObjectType.LAMBDA;
        this.parent = parent;
        this.children = new Array<any>();
        this.children[0] = "lambda";
        this.children[1] = new Array();
    }

    public addParameter(param: string): void {
        this.children[1].push(param);
    }

    public addBody(body: any): void {
        this.children.push(body);
    }

    public getParameters(): Array<any> {
        return this.children[1];
    }

    public getBodies(): Array<any> {
        return this.children.slice(2);
    }
}

// 字符串对象
class StringObject extends SchemeObject {
    public content: string;
    constructor(str: string) {
        super();
        this.type = SchemeObjectType.STRING;
        this.content = str;
    }
}