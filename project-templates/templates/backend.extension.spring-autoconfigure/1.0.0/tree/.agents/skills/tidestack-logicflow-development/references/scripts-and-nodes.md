# 选择表达式、脚本 helper 与节点

简单动态值用已有表达式；流程中的局部转换使用脚本。共享 Java 能力由 ScriptContextContributor 提供 helper 并委托正式 Spring 业务 Bean。需要业务人员反复配置、具有稳定输入输出和编辑器定义时才开发节点。

ScriptContextContributor 按其正式 SPI 注册，核对上下文绑定优先级与隔离；Contributor 提供的绑定可能优先于调用方。不要通过全局可变 Map 在请求之间传用户或业务状态。

新增脚本语言的 Runner/Compiler 与增加 helper 不同，按目标接口分别注册；实现一个 runner 不代表提供沙箱。对不可信脚本查目标执行限制，不把宿主 Java Bean 无边界暴露给所有表达式。

节点开发复用节点定义、参数 Schema、执行器注册和错误契约。验证平台发现、编辑保存、参数回读、真实执行及失败；不要复制一套节点 Registry。只在平台源码中修改节点编辑器或模板时才运行 monorepo 的维护资格检查。

流程 inputSchema/outputSchema 是可选静态提示结构，不改变运行时输入输出校验；节点上下文通过正式节点 SPI 推导，不能把填写提示 Schema 当作新增执行能力。

定位：手册 `guide/advance/extend-backend/extend-script/index.md`、`extend-logicflow/`、`fusion-development/plugin-extensions/backend/script-languages.md`。
