# Vue 自定义登录页模板约束

本项目由 Ouroboros 项目生成器生成，用作 Vue 自定义登录页。

- 登录方式来源于宿主传入的 `hostProps.providers`，不要硬编码固定登录方式列表。
- 本地账号、LDAP、CAS、OAuth2、OIDC 的提交逻辑集中在 `src/authFlow.js`，页面只负责采集输入和触发适配器。
- 多语言文本集中维护在 `src/authFlow.js` 的 `messages`，新增语言或文本键必须同步页面和测试。
- 语言选择优先使用宿主 `hostProps.i18n.getLanguages()`、`hostProps.i18n.getLocale()`、`hostProps.i18n.switchLanguage(locale)`，不要自行维护平台语言状态。
- 不要直接存储 token，不要绕过平台登录适配器调用认证接口。
- 保留 `qiankun` 和 `ouroboros-sdk` 依赖，不要新增 `amis` 依赖。
- 交付前运行 `npm run build` 和 `npm run test:contract`。
