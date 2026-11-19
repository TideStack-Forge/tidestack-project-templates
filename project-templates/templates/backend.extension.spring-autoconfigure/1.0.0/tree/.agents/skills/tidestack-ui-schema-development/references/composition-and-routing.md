# Schema 组合、弹窗路由与选择器

## 选择已有 Schema 的加载方式

| 需要 | 声明及边界 |
| --- | --- |
| 复用已命名的页面或表单 | `type: "ui-schema"`（亦支持 `amis-schema`）配 `schemaId`，使用真实资源标识 |
| 渲染接口已返回的 Schema 对象或数组 | `source` 引用实际数据域中的对象，例如 `${accessControlSettingSchema}` |
| 从接口获取动态 Schema | `source` 使用已存在的 API 契约，核对返回内容和权限 |

`schemaId` 的优先级高于 `source`，不要同时设置后期待 `source` 生效。`source` 为普通字符串时可能按 API 解析；引用已有资源用 `schemaId`，不要把资源名猜成接口地址。动态内容来自服务端仍须核对授权和数据域。

平台组织管理页使用的内层弹窗片段：

```json
{
  "type": "dialog",
  "title": "编辑部门",
  "data": {"id": "${nodeId}"},
  "body": {
    "type": "ui-schema",
    "schemaId": "/system-setting/organization-management/edit-department"
  }
}
```

该片段仅在安装了对应组织管理能力时引用；业务页面替换为自身已有的 Schema 标识和参数。它是 AMIS 内容，保存为 `.ui-schema.json` 时仍需 name/schema 外层包装。

## dialog/drawer 的 url 是页面路由

平台扩展的 `dialog.url/drawer.url` 用于解析已注册页面，可加载 AMIS、内置页或微前端；它与 form.api、crud.api 的 HTTP 接口地址职责不同。文档管理应用使用 `/document-management/upload-file?libraryId=${libraryId}&directoryId=${directoryId}` 打开上传页，提交 API 由该页负责。

使用实际 UI Model 路径和所需参数。基座会合并调用处数据与路由参数/查询参数，重名业务键可能被路由值覆盖；`params/query/pathVariables` 等上下文键也有宿主含义。核对最终弹窗数据，不把业务对象整个塞入保留键，也不假设父页面的 id 始终代表当前行。优先传明确的记录标识，再由被复用表单按契约加载。

弹窗容器和动作由基座协作处理，先遵循[表单与文案](forms-and-copy.md)，再核对保存目标及成功刷新。不能为消除重复按钮全局删除 form.actions，或对所有 form 关闭 panel 包裹。

## 选择器的值形态

参照平台用户/角色管理页，按接口输入确定 `valueField/labelField/multiple/joinValues/extractValue`。多选且 `joinValues: false`、`extractValue: true` 通常用于提交值数组；若接口接收对象数组或拼接字符串，应按其契约选择，不沿用控件默认值猜测。

角色选择使用角色 id，用户选择可能使用 userIdentity，员工选择使用员工 id。显示名称只作 label，不能代替稳定标识；核对新增提交、编辑回显、清空和重复选择后的实际请求。身份转换沿已有后端能力，不仅在界面把字段改名。

## 仅在开发动态字段扩展时读取

普通页面直接编写或引用现有 Schema。确实需要根据模型字段动态生成控件时，复用平台 FieldTypeCatalog 与编译后的输入/展示 Schema、参数和校验；不要另建字段类型映射，也不为普通页面实现 UISchemaProvider。自定义前端组件或 Widget 交付见[前端扩展](../../tidestack-frontend-extension-development/SKILL.md)。

应用参考来自组织管理、用户/角色管理及文档管理页面；源码不可用时使用目标版本随应用公开的接口和资源契约。
