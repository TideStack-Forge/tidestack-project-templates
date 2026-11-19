# 业务异常与错误码的使用

## 选择语义

业务层复用 `com.ouroboros.exception` 的 BusinessException、ValidationException、InternalException、PlatformException。按调用方可处理的语义选类；外部/底层失败保留 cause。未知错误交给平台正式出口，不向用户显示堆栈、SQL 或凭据。

需要稳定识别、结构化业务数据或差异处理时定义明确异常类型，例如库存不足。相同语义复用类型，不为每条消息建立空类，也不按文案或大串 instanceof 分流。

## 一种业务失败的完整例子

以下是新增应用错误的示意；编号须先使用本项目预留区间并检查冲突。放入所属模块 `src/main/metadata/error-codes.error.json` 的集合项：

```json
[
  {
    "code": 42211,
    "bizCode": "warehouse.stock.insufficient",
    "title": "库存不足",
    "defaultMessageTemplate": "物料 {0} 库存不足：可用 {1}，需要 {2}",
    "category": "WAREHOUSE",
    "enabled": true
  }
]
```

类型与资源保持相同 code/bizCode；fallback 在未加载定义时仍提供安全消息，参数使用 MessageFormat 的序号：

```java
import com.ouroboros.errorcode.ErrorCodeReference;
import com.ouroboros.errorcode.SimpleErrorCodeReference;
import com.ouroboros.exception.BusinessException;

public final class InsufficientStockException extends BusinessException {
  private static final ErrorCodeReference ERROR = new SimpleErrorCodeReference(
      42211, "warehouse.stock.insufficient",
      "物料 {0} 库存不足：可用 {1}，需要 {2}");
  private final String itemId;
  private final long available;
  private final long requested;

  public InsufficientStockException(String itemId, long available, long requested) {
    super(ERROR, itemId, available, requested);
    this.itemId = itemId;
    this.available = available;
    this.requested = requested;
  }

  public String getItemId() { return itemId; }
  public long getAvailable() { return available; }
  public long getRequested() { return requested; }
}
```

业务用例拒绝时抛出该类型，调用方需要恢复时按明确类型处理。异常字段供业务代码使用，不代表全部自动输出到 HTTP；对外结构与消息由实际错误契约决定。国际化复用正式错误码/本地化能力，不在 Controller 拼一套错误响应。

## 加载与验证

按[metadata](../../tidestack-metadata-definition/SKILL.md)校验定义，确认应用已装配错误码运行库并实际加载资源。无需为普通业务错误新增 Registry、Resolver 或 Advice。

核对直接抛出、带 cause 的底层失败、请求校验和未知错误的 HTTP 状态、响应 code、参数及安全消息，并覆盖语言和缺定义时的回退。当前示例 42211 按默认包装结果映射为 HTTP 422；自定义编号不能凭业务语义推断 HTTP 状态，应沿项目错误码约定并验证正式出口，不能把编号直接当 HTTP 状态传入。

ErrorCodeReference 是引用，错误码资源提供稳定定义；两者都不替代异常分类。本文依据目标版本 common-exception/common-error-code 的公开构造器，以及平台实际错误响应行为，不要求应用实现平台内部桥接。
