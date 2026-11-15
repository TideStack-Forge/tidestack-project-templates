# ${project.name}

这是一个 Vue 自定义登录页模板，可接入平台认证流程。

- 交付类型：前端应用
- npm 包名：`${packageName}`
- 品牌名称：`${brandName}`
- 登录入口：`loginEntry`
- SDK 使用说明：https://www.npmjs.com/package/ouroboros-sdk
- 平台依赖：`qiankun`、`ouroboros-sdk`；不要额外引入 `amis`

## 开发工具

推荐安装 **TideStack Develop** 插件以获得更好的开发体验：使用 IntelliJ IDEA 时，可在 JetBrains Marketplace 搜索并安装 `TideStack Develop`；使用 Visual Studio Code 时，可在 VS Code Marketplace 搜索并安装同名插件。插件提供模型元数据的可视化编辑、项目开发配置和本地调试相关能力，适合与本模板生成的项目配合使用。

构建：

```bash
npm install
npm run build
npm run test:contract
```

## 登录方式

登录流程工具函数在 `src/authFlow.js`：

- `LOCAL`：`submitCredentialLogin` 调用宿主传入的 `login`
- `LDAP`：`submitLdapLogin` 调用宿主传入的 `loginWithLdap`
- `CAS`、`OAUTH2`、`OIDC`：`startSsoLogin` 调用宿主传入的 `startRedirectLogin`
- `returnUrl`：统一经过 `resolveReturnUrl` 规范化

页面组件在 `src/App.vue`，当前通过 `hostProps.providers` 和 `hostProps.locale` 生成登录模型，并展示加载文案、失败文案、账号密码区域和重定向 provider 类型。接入真实提交动作时，应复用 `authFlow.js` 中的提交函数，不要在组件里直接拼认证接口。

## 多语言选择

语言选择框建议放在登录卡片右上角或标题区域，不要放进账号密码表单内部。平台 SDK 已确认 `i18n` 提供 `getLocale()`、`getLanguages()`、`switchLanguage(locale)`、`t()`、`tn()`、`tCommon()`、`onLocaleChange()` 等能力；如果宿主通过 `hostProps.i18n` 注入，语言选择框应调用这些方法。

当前模板内置 `zh-CN` 和 `en-US` 两组文本，文本键在 `src/authFlow.js`：

- `loading`：加载登录方式
- `failed`：登录方式加载失败或通用失败
- `invalidCredentials`：账号或密码不正确

新增文案时同步扩展 `messages`、页面使用点和契约测试。

## 修改原则

不要在登录页里硬编码认证接口。登录页只负责采集输入和调用宿主传入的登录适配器；令牌写入、账号绑定、重定向完成等动作由平台认证流程处理。
