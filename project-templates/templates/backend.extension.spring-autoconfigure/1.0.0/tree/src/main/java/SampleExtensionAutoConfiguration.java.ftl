package ${esc.javaPackage(packageName)};

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.AutoConfiguration;

@AutoConfiguration
public class ${esc.identifier(autoConfigurationClassName)} {
  private static final Logger logger = LoggerFactory.getLogger(${esc.identifier(autoConfigurationClassName)}.class);

  @PostConstruct
  public void init() {
    logger.info("{} loaded", ${esc.javaString(artifactId)});
  }
}
