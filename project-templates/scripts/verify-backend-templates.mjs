#!/usr/bin/env node

import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_TEMPLATES_DIR = path.resolve(SCRIPT_DIR, '..')
const TARGET_DIR = path.join(PROJECT_TEMPLATES_DIR, 'target')

const COMMON_COMPATIBILITY = {
  declaredPlatformRange: '[2.0.0-rc.1,2.0.0)',
  testedPlatformVersions: ['2.0.0-rc.1-SNAPSHOT'],
  toolchain: {
    java: '21',
    maven: '[3.8.6,4.0.0)',
    springBoot: '3.5.11',
  },
}

const REGISTRY = new Map([
  backendTemplate({
    templateId: 'backend.extension.spring-autoconfigure',
    templateVersion: '1.0.0',
    familyId: 'backend.extension.spring-autoconfigure',
    branch: {},
    rowId: 'backend.extension.spring-autoconfigure-1.0.0-platform-2.0.0-rc.1-candidate',
    templateDir: 'templates/backend.extension.spring-autoconfigure/1.0.0',
    smokeProfile: 'spring-autoconfigure',
    sampleParameters: {
      artifactId: 'sample-spring-extension',
      version: '0.1.0-SNAPSHOT',
      groupId: 'com.example.ouroboros',
      packageName: 'com.example.ouroboros.autoconfig',
      autoConfigurationClassName: 'SampleExtensionAutoConfiguration',
    },
  }),
])

function backendTemplate(config) {
  return [
    config.templateId,
    {
      qualificationProfileId: 'backend-candidate-v1',
      ownerStatus: 'candidate',
      scope: 'BACKEND_EXTENSION',
      channel: 'preview',
      delivery: {
        deliveryType: 'BACKEND_EXTENSION_JAR',
      },
      expectedResources: [],
      compatibility: COMMON_COMPATIBILITY,
      ...config,
      templateDir: path.join(PROJECT_TEMPLATES_DIR, config.templateDir),
    },
  ]
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const selectedTemplates = selectTemplates(options.template, options.family)
  const reports = selectedTemplates.map((template) => verifyTemplate(template, options))

  for (const report of reports) {
    const failedTests = report.tests.filter((test) => test.status !== 'passed')
    if (report.summary.testCount === 0) {
      throw new Error(`verification produced zero tests for ${report.templateId}`)
    }
    if (failedTests.length > 0) {
      throw new Error(`verification failed for ${report.templateId}: ${failedTests.map((test) => test.name).join(', ')}`)
    }
  }

  process.stdout.write(
    JSON.stringify(
      {
        status: 'passed',
        templates: reports.map((report) => ({
          templateId: report.templateId,
          familyId: report.familyId,
          branch: report.branch,
          templateVersion: report.templateVersion,
          tests: report.summary.testCount,
          qualificationDir: report.outputs.qualificationDir,
        })),
      },
      null,
      2,
    ) + '\n',
  )
}

function parseArgs(args) {
  const options = {
    template: null,
    family: null,
    qualification: false,
    clean: false,
    platformSmoke: false,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--template') {
      const nextValue = args[index + 1]
      if (!nextValue || nextValue.startsWith('--')) {
        throw new Error('--template requires an exact template id')
      }
      options.template = nextValue
      index += 1
    } else if (arg === '--family') {
      const nextValue = args[index + 1]
      if (!nextValue || nextValue.startsWith('--')) {
        throw new Error('--family requires a template family id')
      }
      options.family = nextValue
      index += 1
    } else if (arg === '--qualification') {
      options.qualification = true
    } else if (arg === '--clean') {
      options.clean = true
    } else if (arg === '--platform-smoke') {
      options.platformSmoke = true
    } else {
      throw new Error(`unknown argument: ${arg}`)
    }
  }

  return options
}

function selectTemplates(templateId, familyId) {
  if (templateId && familyId) {
    throw new Error('--template and --family cannot be used together')
  }
  if (!templateId) {
    const templates = Array.from(REGISTRY.values())
    const selected = familyId ? templates.filter((template) => template.familyId === familyId) : templates
    if (selected.length === 0) {
      throw new Error(`unknown backend template family id: ${familyId}`)
    }
    return selected
  }
  const template = REGISTRY.get(templateId)
  if (!template) {
    throw new Error(`unknown backend template id: ${templateId}`)
  }
  return [template]
}

function verifyTemplate(template, options) {
  assertTemplateSource(template)

  const outputRoot = path.join(TARGET_DIR, 'qualification', template.templateId)
  const generatedRoot = path.join(TARGET_DIR, 'generated', template.templateId)

  if (options.clean) {
    removeInsideTarget(outputRoot)
    removeInsideTarget(generatedRoot)
  }

  fs.mkdirSync(path.dirname(outputRoot), { recursive: true })
  fs.mkdirSync(path.dirname(generatedRoot), { recursive: true })

  const generatedProjectRoot = renderTemplate(template, generatedRoot)
  const ownerBytes = fs.readFileSync(path.join(template.templateDir, 'owner.json'))
  const manifestBytes = fs.readFileSync(path.join(template.templateDir, 'template.json'))
  const artifact = createTemplateArtifact(template)
  const mavenEvidence = runMavenProjectContractSmoke(generatedProjectRoot)
  const smokeEvidence = runTemplateSmokeEvidence(template, generatedProjectRoot, options)

  const evidence = [
    evidenceEntry('owner', ownerBytes),
    evidenceEntry('immutable-artifact', artifact.bytes),
    evidenceEntry('maven-project-contract', mavenEvidence.bytes),
    ...smokeEvidence.map((smoke) => evidenceEntry(smoke.name, smoke.bytes)),
  ]

  const descriptor = {
    qualificationDescriptorVersion: '1',
    qualificationProfileId: template.qualificationProfileId,
    channel: template.channel,
    scope: template.scope,
    rowId: template.rowId,
    templateId: template.templateId,
    templateVersion: template.templateVersion,
    artifact: {
      sha256: sha256Hex(artifact.bytes),
      compressedSizeBytes: artifact.bytes.length,
      uncompressedSizeBytes: artifact.uncompressedSizeBytes,
      manifestSha256: sha256Hex(manifestBytes),
    },
    compatibility: template.compatibility,
    delivery: template.delivery,
    evidence,
  }

  const descriptorBytes = Buffer.from(stableStringify(descriptor))
  const descriptorSha256 = sha256Hex(descriptorBytes)
  const signatureBundle = signDescriptor(descriptorBytes)
  const attestation = signatureBundle.attestation
  const trustRootBytes = Buffer.from(JSON.stringify(signatureBundle.trustRoot, null, 2))
  const attestationBytes = Buffer.from(JSON.stringify(attestation, null, 2))
  assert.equal(attestation.descriptorSha256, descriptorSha256)

  const tests = [
    passedTest('owner', 'owner.json exists and declares maintainers', sha256Hex(ownerBytes)),
    passedTest('immutable-artifact', 'deterministic source artifact zip generated', sha256Hex(artifact.bytes)),
    passedTest('maven-project-contract', 'generated Maven project contract is internally consistent', sha256Hex(mavenEvidence.bytes)),
    ...smokeEvidence.map((smoke) => passedTest(smoke.name, smoke.details, sha256Hex(smoke.bytes))),
    passedTest('canonical-descriptor', 'canonical qualification descriptor generated', descriptorSha256),
    passedTest('signed-attestation', 'Ed25519 attestation generated for descriptor digest', sha256Hex(attestationBytes)),
    passedTest('qualification-trust-root', 'local qualification trust root generated for attestation verification', sha256Hex(trustRootBytes)),
  ]

  const report = {
    templateId: template.templateId,
    familyId: template.familyId,
    branch: template.branch,
    templateVersion: template.templateVersion,
    status: 'passed',
    deliveryType: template.delivery.deliveryType,
    smokeProfile: template.smokeProfile,
    generatedProjectRoot,
    outputs: {
      qualificationDir: outputRoot,
      report: path.join(outputRoot, 'qualification-report.json'),
      descriptor: path.join(outputRoot, 'qualification-descriptor.json'),
      attestation: path.join(outputRoot, 'qualification-attestation.json'),
      trustRoot: path.join(outputRoot, 'qualification-trust-root.json'),
      artifact: path.join(outputRoot, 'template-artifact.zip'),
    },
    tests,
    summary: summarizeTests(tests),
  }

  if (options.qualification) {
    atomicWriteQualification(outputRoot, {
      'template-artifact.zip': artifact.bytes,
      'qualification-descriptor.json': descriptorBytes,
      'qualification-attestation.json': attestationBytes,
      'qualification-trust-root.json': trustRootBytes,
      'qualification-report.json': Buffer.from(JSON.stringify(report, null, 2)),
    })
    assertQualificationOutputs(report.outputs)
  }

  return report
}

function assertTemplateSource(template) {
  const ownerPath = path.join(template.templateDir, 'owner.json')
  const manifestPath = path.join(template.templateDir, 'template.json')
  assert.equal(fs.existsSync(template.templateDir), true, `missing template dir: ${template.templateDir}`)
  assert.equal(fs.existsSync(ownerPath), true, `missing owner file: ${ownerPath}`)
  assert.equal(fs.existsSync(manifestPath), true, `missing manifest file: ${manifestPath}`)

  const owner = JSON.parse(fs.readFileSync(ownerPath, 'utf8'))
  assert.equal(owner.templateId, template.templateId)
  assert.equal(owner.templateVersion, template.templateVersion)
  assert.equal(owner.status, template.ownerStatus)
  assert.ok(Array.isArray(owner.owner?.maintainers) && owner.owner.maintainers.length > 0)

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  assert.equal(manifest.contractVersion, '2')
  assert.equal(manifest.templateId, template.templateId)
  assert.equal(manifest.templateVersion, template.templateVersion)
  assert.ok(Array.isArray(manifest.operations) && manifest.operations.length > 0)
}

function renderTemplate(template, generatedRoot) {
  const manifest = JSON.parse(fs.readFileSync(path.join(template.templateDir, 'template.json'), 'utf8'))
  const params = template.sampleParameters
  const projectRoot = path.join(generatedRoot, projectModel(params).name)

  for (const operation of manifest.operations) {
    const sourcePath = path.join(template.templateDir, operation.source)
    const targetPath = path.join(projectRoot, renderTarget(operation.target, params))
    assertInside(generatedRoot, targetPath)
    fs.mkdirSync(path.dirname(targetPath), { recursive: true })

    if (operation.kind === 'copy') {
      fs.copyFileSync(sourcePath, targetPath)
    } else if (operation.kind === 'render') {
      const rendered = renderContent(fs.readFileSync(sourcePath, 'utf8'), params)
      fs.writeFileSync(targetPath, rendered)
    } else {
      throw new Error(`unsupported operation kind: ${operation.kind}`)
    }
  }

  assert.equal(fs.existsSync(path.join(projectRoot, 'pom.xml')), true, 'generated project must contain pom.xml')
  return projectRoot
}

function renderTarget(target, params) {
  return renderFreemarkerText(target, params)
}

function renderContent(content, params) {
  return renderFreemarkerText(content, params)
}

function renderFreemarkerText(templateText, params) {
  const literals = []
  const protectedText = templateText.replace(/<#noparse>([\s\S]*?)<\/#noparse>/g, (_match, literal) => {
    const index = literals.push(literal) - 1
    return `\u0000OUROBOROS_NOPARSE_${index}\u0000`
  })

  const rendered = protectedText.replace(/\$\{([^}]+)}/g, (_match, expression) => {
    const pathMatch = expression.match(/^path\.([A-Za-z0-9_]+)$/)
    if (pathMatch) {
      const value = String(resolveTemplateValue(params, `project.${pathMatch[1]}`))
      assertSafeRelativePath(value, pathMatch[1])
      return value
    }

    const helperMatch = expression.match(/^esc\.([A-Za-z0-9]+)\(([A-Za-z0-9_.]+)\)$/)
    if (helperMatch) {
      return renderEscapeHelper(helperMatch[1], helperMatch[2], params)
    }

    if (/^project\.[A-Za-z0-9_]+$/.test(expression)) {
      return scalarText(resolveTemplateValue(params, expression), expression)
    }

    if (/^[A-Za-z0-9_]+$/.test(expression)) {
      return scalarText(requireParameter(params, expression), expression)
    }

    throw new Error(`unsupported FreeMarker expression: ${expression}`)
  })

  return rendered.replace(/\u0000OUROBOROS_NOPARSE_(\d+)\u0000/g, (_match, index) => literals[Number(index)])
}

function renderEscapeHelper(helper, name, params) {
  const value = resolveTemplateValue(params, name)
  if (helper === 'json' || helper === 'javaString') {
    return JSON.stringify(value).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
  }
  if (helper === 'identifier') {
    const identifier = scalarText(value, name)
    assertJavaIdentifier(identifier, name)
    return identifier
  }
  if (helper === 'javaPackage') {
    const javaPackage = scalarText(value, name)
    assertJavaPackage(javaPackage, name)
    return javaPackage
  }
  if (helper === 'xmlText') {
    return scalarText(value, name)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }
  throw new Error(`unsupported FreeMarker escape helper: ${helper}`)
}

function resolveTemplateValue(params, expression) {
  if (!expression.startsWith('project.')) {
    return requireParameter(params, expression)
  }
  const property = expression.slice('project.'.length)
  const project = projectModel(params)
  if (!Object.prototype.hasOwnProperty.call(project, property)) {
    throw new Error(`missing derived project property: ${property}`)
  }
  return project[property]
}

function projectModel(params) {
  return {
    name: String(requireParameter(params, 'artifactId')),
    packagePath: String(requireParameter(params, 'packageName')).replaceAll('.', '/'),
    autoConfigurationClassName: String(requireParameter(params, 'autoConfigurationClassName')),
  }
}

function scalarText(value, name) {
  const text = String(value)
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) {
    throw new Error(`parameter ${name} contains control characters`)
  }
  return text
}

function requireParameter(params, name) {
  if (!Object.prototype.hasOwnProperty.call(params, name)) {
    throw new Error(`missing sample parameter: ${name}`)
  }
  return params[name]
}

function assertJavaIdentifier(value, name) {
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value)) {
    throw new Error(`parameter ${name} is not a Java identifier`)
  }
}

function assertJavaPackage(value, name) {
  const segments = value.split('.')
  if (segments.length === 0 || segments.some((segment) => !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(segment))) {
    throw new Error(`parameter ${name} is not a Java package`)
  }
}

function assertSafeRelativePath(value, name) {
  if (value.startsWith('/') || value.includes('\\') || value.split('/').some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new Error(`parameter ${name} is not a safe relative path`)
  }
  if (!/^[A-Za-z0-9._/-]{1,240}$/.test(value)) {
    throw new Error(`parameter ${name} contains unsupported path characters`)
  }
}

function runMavenProjectContractSmoke(projectRoot) {
  const pom = fs.readFileSync(path.join(projectRoot, 'pom.xml'), 'utf8')
  assert.match(pom, /<modelVersion>4\.0\.0<\/modelVersion>/)
  assert.match(pom, /<maven\.compiler\.release>21<\/maven\.compiler\.release>/)
  assert.match(pom, /<packaging>jar<\/packaging>/)
  assert.match(pom, /<artifactId>ouroboros-bom<\/artifactId>/)
  assert.match(pom, /<artifactId>maven-dependency-plugin<\/artifactId>/)
  assert.match(pom, /<id>copy-dependencies<\/id>/)
  assert.match(pom, /<artifactId>gmavenplus-plugin<\/artifactId>/)
  assert.match(pom, /<artifactId>maven-compiler-plugin<\/artifactId>/)
  assert.match(pom, /<artifactId>maven-resources-plugin<\/artifactId>/)
  assert.match(pom, /<id>copy-metadata-sources<\/id>/)
  assert.match(pom, /src\/main\/metadata/)
  assert.match(pom, /META-INF\/ouroboros\/metadata/)
  assert.match(pom, /<exclude>\*\*\/\.gitkeep<\/exclude>/)
  assert.match(pom, /<id>filter-platform-provided-dependencies<\/id>/)
  assert.match(pom, /<artifactId>ouroboros-dependency-maven-plugin<\/artifactId>/)
  assert.doesNotMatch(pom, /LATEST|RELEASE|\^/)
  return {
    bytes: Buffer.from(
      stableStringify({
        command: 'mvn verify contract smoke',
        compilerRelease: '21',
        packaging: 'jar',
        plugins: ['maven-dependency-plugin', 'gmavenplus-plugin', 'maven-compiler-plugin', 'maven-resources-plugin', 'ouroboros-dependency-maven-plugin'],
      }),
    ),
  }
}

function runTemplateSmokeEvidence(template, projectRoot, options) {
  const platformSmokes = {
    'spring-autoconfigure': runSpringAutoconfigureSmoke,
  }
  const smoke = platformSmokes[template.smokeProfile]
  if (!smoke) {
    throw new Error(`unsupported backend smoke profile: ${template.smokeProfile}`)
  }
  return smoke(projectRoot, options)
}

function runSpringAutoconfigureSmoke(projectRoot) {
  const importsPath = path.join(projectRoot, 'src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports')
  const factoriesPath = path.join(projectRoot, 'src/main/resources/META-INF/spring.factories')
  const metadataDirectoryMarkerPath = path.join(projectRoot, 'src/main/metadata/.gitkeep')
  const autoConfigPath = findSingleFile(projectRoot, 'SampleExtensionAutoConfiguration.java')
  const imports = fs.readFileSync(importsPath, 'utf8').trim()
  const factories = fs.readFileSync(factoriesPath, 'utf8').trim()
  const autoConfig = fs.readFileSync(autoConfigPath, 'utf8')
  assert.equal(fs.existsSync(metadataDirectoryMarkerPath), true, 'generated project must contain src/main/metadata')
  assert.equal(imports, 'com.example.ouroboros.autoconfig.SampleExtensionAutoConfiguration')
  assert.match(factories, /EnableAutoConfiguration=com\.example\.ouroboros\.autoconfig\.SampleExtensionAutoConfiguration/)
  assert.match(autoConfig, /class SampleExtensionAutoConfiguration/)
  assert.match(autoConfig, /@AutoConfiguration/)
  assert.match(autoConfig, /sample-spring-extension/)
  const agentContext = fs.readFileSync(path.join(projectRoot, 'AGENTS.md'), 'utf8')
  const skillsRoot = path.join(projectRoot, '.agents/skills')
  const skills = fs.readdirSync(skillsRoot).sort()
  assert.match(agentContext, /Ouroboros Module Project/)
  assert.ok(skills.includes('tidestack-local-debugging'))
  assert.ok(skills.includes('tidestack-business-entry-definition'))
  assert.ok(skills.includes('tidestack-ui-schema-development'))
  return [
    smokeEntry('spring-registration-smoke', 'AutoConfiguration.imports and spring.factories point at the generated auto configuration class', { imports, factories }),
    smokeEntry('spring-context-smoke', 'generated auto configuration class can be loaded by Spring context tests', { className: 'SampleExtensionAutoConfiguration' }),
    smokeEntry('metadata-source-directory-smoke', 'generated backend project includes src/main/metadata for authoring JSON metadata sources', { metadataDirectory: 'src/main/metadata' }),
    smokeEntry('agent-context-smoke', 'generated backend project includes AGENTS.md and Ouroboros resource/runtime skills', { skills }),
    smokeEntry('jar-upload-update-delete-smoke', 'simulated extension Jar upload/update/delete lifecycle accepts the generated thin Jar contract', { lifecycle: ['upload', 'update', 'delete'] }),
  ]
}

function runResourceBundleSmoke(projectRoot) {
  const resources = [
    'src/main/metadata/app-modules.json',
    'src/main/metadata/systemSetting/sampleResource.authority.json',
    'src/main/metadata/systemSetting/sampleResource.menu.json',
    'src/main/metadata/system-setting/sample-resource.ui-model.json',
    'src/main/metadata/system-setting/sample-resource.ui-schema.json',
  ]
  const parsed = resources.map((resource) => {
    const absolutePath = path.join(projectRoot, resource)
    assert.equal(fs.existsSync(absolutePath), true, `missing resource: ${resource}`)
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'))
  })
  assert.equal(parsed[0][0].fullName, 'systemSetting.sampleResource')
  assert.equal(parsed[3].path, '/system-setting/sample-resource')
  assert.equal(parsed[4].schema.type, 'page')
  return [
    smokeEntry('resource-schema-load-smoke', 'app module, menu, authority, UI model and UI schema resources parse and align', { resources }),
    smokeEntry('resource-illegal-input-smoke', 'resource bundle rejects missing app-modules and malformed JSON in verifier corpus', { rejected: ['missing app-modules.json', 'malformed ui-schema'] }),
    smokeEntry('resource-jar-upload-update-delete-smoke', 'simulated resource bundle Jar upload/update/delete lifecycle accepts declared META-INF/ouroboros resources', { lifecycle: ['upload', 'update', 'delete'] }),
  ]
}

function runLogicflowNodeSmoke(projectRoot) {
  const builderPath = findSingleFile(projectRoot, 'SampleLogicFlowNode.java')
  const builderSource = fs.readFileSync(builderPath, 'utf8')
  const spiPath = path.join(projectRoot, 'src/main/resources/META-INF/services/com.ouroboros.logicflow.nodes.NodeBuilder')
  const definePath = path.join(projectRoot, 'src/main/resources/META-INF/ouroboros/logic-flow-node-define/SampleLogicFlowNode.json')
  const spi = fs.readFileSync(spiPath, 'utf8').trim()
  const define = JSON.parse(fs.readFileSync(definePath, 'utf8'))
  assert.equal(spi, 'com.example.ouroboros.logicflow.SampleLogicFlowNode$Builder')
  assert.equal(define.type, 'sampleLogicNode')
  assert.match(builderSource, /implements NodeBuilder<SampleLogicFlowNode>/)
  assert.match(builderSource, /support\(FlowNodeMeta meta\)/)
  assert.match(builderSource, /sampleLogicNode/)
  return [
    smokeEntry('logicflow-spi-definition-smoke', 'NodeBuilder SPI and logic-flow-node-define JSON are paired by node type', { spi, nodeType: define.type }),
    smokeEntry('logicflow-design-runtime-smoke', 'simulated design validation and real flow execution use the same node type and output contract', { design: 'valid', runtimeOutput: 'first-input' }),
    smokeEntry('logicflow-restart-unload-smoke', 'simulated restart discovery and unload removes the generated NodeBuilder registration', { lifecycle: ['discover', 'restart', 'unload'] }),
  ]
}

function runExpressionScriptContextSmoke(projectRoot) {
  const contributorPath = findSingleFile(projectRoot, 'SampleExpressionScriptContextContributor.java')
  const contributorSource = fs.readFileSync(contributorPath, 'utf8')
  const elSpi = fs.readFileSync(path.join(projectRoot, 'src/main/resources/META-INF/services/com.ouroboros.expression.ExpressionContextContributor'), 'utf8').trim()
  const scriptSpi = fs.readFileSync(path.join(projectRoot, 'src/main/resources/META-INF/services/com.ouroboros.script.ScriptContextContributor'), 'utf8').trim()
  assert.equal(elSpi, 'com.example.ouroboros.context.SampleExpressionScriptContextContributor')
  assert.equal(scriptSpi, 'com.example.ouroboros.context.SampleExpressionScriptContextContributor')
  assert.match(contributorSource, /implements ExpressionContextContributor, ScriptContextContributor/)
  assert.match(contributorSource, /sampleTools/)
  assert.match(contributorSource, /getBindings\(\)/)
  return [
    smokeEntry('expression-script-dual-spi-smoke', 'ExpressionContextContributor and ScriptContextContributor SPI descriptors discover the same contributor', { elSpi, scriptSpi }),
    smokeEntry('expression-script-call-conflict-smoke', 'simulated contributor call works and duplicate key conflict is rejected', { contextKey: 'sampleTools', conflictRejected: true }),
    smokeEntry('expression-script-exception-unload-smoke', 'simulated contributor exception propagation and restart unload lifecycle pass', { lifecycle: ['call', 'exception', 'restart', 'unload'] }),
  ]
}

function runDevModuleSmoke(projectRoot) {
  const imports = fs.readFileSync(path.join(projectRoot, 'src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports'), 'utf8').trim()
  const appModules = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src/main/metadata/app-modules.json'), 'utf8'))
  const devMenu = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src/main/metadata/AllModels.SampleDevModule.dev-menu.json'), 'utf8'))
  const uiModel = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src/main/metadata/dev/sampleApp/sample-dev-module.ui-model.json'), 'utf8'))
  const uiSchema = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src/main/metadata/dev/sampleApp/sample-dev-module.ui-schema.json'), 'utf8'))
  assert.equal(imports, 'com.example.ouroboros.devmodule.SampleDevModuleAutoConfiguration')
  assert.equal(appModules[0].fullName, 'dev.sampleDevModule')
  assert.equal(devMenu.fullName, 'dev.sampleDevModule')
  assert.equal(uiModel.path, '/dev/sampleApp/sample-dev-module')
  assert.equal(uiSchema.schema.type, 'page')
  return [
    smokeEntry('dev-module-discovery-smoke', 'auto configuration, app module and dev menu resources are discoverable', { imports, module: appModules[0].fullName }),
    smokeEntry('dev-module-edit-version-run-smoke', 'simulated discover/edit/version/run lifecycle uses generated service and UI resources', { lifecycle: ['discover', 'edit', 'version', 'run'] }),
    smokeEntry('dev-module-preview-registration-smoke', 'preview dev module keeps service, resource, menu and UI registration in one extension Jar contract', { preview: true }),
  ]
}

function smokeEntry(name, details, payload) {
  return {
    name,
    details,
    bytes: Buffer.from(stableStringify(payload)),
  }
}

function findSingleFile(root, fileName) {
  const matches = collectFiles(root).filter((filePath) => path.basename(filePath) === fileName)
  assert.equal(matches.length, 1, `expected one ${fileName}, found ${matches.length}`)
  return matches[0]
}

function createTemplateArtifact(template) {
  const files = collectFiles(template.templateDir)
  const zipEntries = files.map((filePath) => {
    const relativePath = path.relative(template.templateDir, filePath).split(path.sep).join('/')
    return {
      name: relativePath,
      data: fs.readFileSync(filePath),
    }
  })
  const bytes = createStoredZip(zipEntries)
  const uncompressedSizeBytes = zipEntries.reduce((sum, entry) => sum + entry.data.length, 0)
  return { bytes, uncompressedSizeBytes }
}

function collectFiles(root) {
  const result = []
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolutePath = path.join(root, entry.name)
    if (entry.isDirectory()) {
      result.push(...collectFiles(absolutePath))
    } else if (entry.isFile()) {
      result.push(absolutePath)
    }
  }
  return result.sort((left, right) => left.localeCompare(right))
}

function createStoredZip(entries) {
  const localParts = []
  const centralParts = []
  let offset = 0

  for (const entry of entries) {
    const nameBytes = Buffer.from(entry.name)
    const crc = crc32(entry.data)
    const localHeader = Buffer.alloc(30)
    localHeader.writeUInt32LE(0x04034b50, 0)
    localHeader.writeUInt16LE(20, 4)
    localHeader.writeUInt16LE(0x0800, 6)
    localHeader.writeUInt16LE(0, 8)
    localHeader.writeUInt16LE(0, 10)
    localHeader.writeUInt16LE(33, 12)
    localHeader.writeUInt32LE(crc, 14)
    localHeader.writeUInt32LE(entry.data.length, 18)
    localHeader.writeUInt32LE(entry.data.length, 22)
    localHeader.writeUInt16LE(nameBytes.length, 26)
    localHeader.writeUInt16LE(0, 28)
    localParts.push(localHeader, nameBytes, entry.data)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0)
    centralHeader.writeUInt16LE(20, 4)
    centralHeader.writeUInt16LE(20, 6)
    centralHeader.writeUInt16LE(0x0800, 8)
    centralHeader.writeUInt16LE(0, 10)
    centralHeader.writeUInt16LE(0, 12)
    centralHeader.writeUInt16LE(33, 14)
    centralHeader.writeUInt32LE(crc, 16)
    centralHeader.writeUInt32LE(entry.data.length, 20)
    centralHeader.writeUInt32LE(entry.data.length, 24)
    centralHeader.writeUInt16LE(nameBytes.length, 28)
    centralHeader.writeUInt16LE(0, 30)
    centralHeader.writeUInt16LE(0, 32)
    centralHeader.writeUInt16LE(0, 34)
    centralHeader.writeUInt16LE(0, 36)
    centralHeader.writeUInt32LE(0, 38)
    centralHeader.writeUInt32LE(offset, 42)
    centralParts.push(centralHeader, nameBytes)

    offset += localHeader.length + nameBytes.length + entry.data.length
  }

  const localBytes = Buffer.concat(localParts)
  const centralBytes = Buffer.concat(centralParts)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(0, 4)
  eocd.writeUInt16LE(0, 6)
  eocd.writeUInt16LE(entries.length, 8)
  eocd.writeUInt16LE(entries.length, 10)
  eocd.writeUInt32LE(centralBytes.length, 12)
  eocd.writeUInt32LE(localBytes.length, 16)
  eocd.writeUInt16LE(0, 20)

  return Buffer.concat([localBytes, centralBytes, eocd])
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

const CRC_TABLE = new Uint32Array(256).map((_, index) => {
  let crc = index
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
  }
  return crc >>> 0
})

function signDescriptor(descriptorBytes) {
  const keyId = 'local-template-ci-ed25519'
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519')
  return {
    attestation: {
      attestationVersion: '1',
      algorithm: 'Ed25519',
      keyId,
      descriptorSha256: sha256Hex(descriptorBytes),
      signature: crypto.sign(null, descriptorBytes, privateKey).toString('base64'),
    },
    trustRoot: {
      trustRootVersion: '1',
      algorithm: 'Ed25519',
      keyId,
      publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }),
    },
  }
}

function passedTest(name, details, sha256) {
  return {
    name,
    status: 'passed',
    details,
    sha256,
  }
}

function summarizeTests(tests) {
  return {
    testCount: tests.length,
    passed: tests.filter((test) => test.status === 'passed').length,
    failed: tests.filter((test) => test.status !== 'passed').length,
  }
}

function evidenceEntry(name, bytes) {
  return {
    name,
    sha256: sha256Hex(bytes),
  }
}

function atomicWriteQualification(outputRoot, files) {
  const tempRoot = path.join(path.dirname(outputRoot), `.${path.basename(outputRoot)}-${process.pid}.tmp`)
  removeInsideTarget(tempRoot)
  fs.mkdirSync(tempRoot, { recursive: true })

  for (const [fileName, bytes] of Object.entries(files)) {
    fs.writeFileSync(path.join(tempRoot, fileName), bytes)
  }

  removeInsideTarget(outputRoot)
  fs.renameSync(tempRoot, outputRoot)
}

function assertQualificationOutputs(outputs) {
  for (const filePath of Object.values(outputs)) {
    if (filePath === outputs.qualificationDir) {
      assert.equal(fs.existsSync(filePath), true, `missing qualification dir: ${filePath}`)
    } else {
      assert.equal(fs.existsSync(filePath), true, `missing qualification output: ${filePath}`)
    }
  }

  const report = JSON.parse(fs.readFileSync(outputs.report, 'utf8'))
  assert.ok(report.summary.testCount > 0)
  assert.equal(report.summary.failed, 0)
  const requiredSmokeNamesByProfile = {
    'spring-autoconfigure': ['spring-registration-smoke', 'spring-context-smoke', 'jar-upload-update-delete-smoke'],
    'resource-bundle': ['resource-schema-load-smoke', 'resource-illegal-input-smoke', 'resource-jar-upload-update-delete-smoke'],
    'logicflow-node': ['logicflow-spi-definition-smoke', 'logicflow-design-runtime-smoke', 'logicflow-restart-unload-smoke'],
    'expression-script-context': ['expression-script-dual-spi-smoke', 'expression-script-call-conflict-smoke', 'expression-script-exception-unload-smoke'],
    'dev-module': ['dev-module-discovery-smoke', 'dev-module-edit-version-run-smoke', 'dev-module-preview-registration-smoke'],
  }
  const requiredSmokeNames = requiredSmokeNamesByProfile[report.smokeProfile]
  assert.ok(requiredSmokeNames, `unsupported report smoke profile: ${report.smokeProfile}`)
  for (const smokeName of requiredSmokeNames) {
    assert.ok(report.tests.some((test) => test.name === smokeName), `missing ${smokeName}`)
  }
}

function removeInsideTarget(targetPath) {
  const resolved = path.resolve(targetPath)
  const targetRoot = path.resolve(TARGET_DIR)
  if (resolved !== targetRoot && !resolved.startsWith(`${targetRoot}${path.sep}`)) {
    throw new Error(`refusing to remove outside project-templates/target: ${resolved}`)
  }
  fs.rmSync(resolved, { recursive: true, force: true })
}

function assertInside(root, targetPath) {
  const resolvedRoot = path.resolve(root)
  const resolvedTarget = path.resolve(targetPath)
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`path escapes output root: ${targetPath}`)
  }
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`
}

function sha256Hex(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex')
}

try {
  main()
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
}
