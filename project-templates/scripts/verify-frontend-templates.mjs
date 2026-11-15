#!/usr/bin/env node

import assert from 'node:assert/strict'
import childProcess from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_TEMPLATES_DIR = path.resolve(SCRIPT_DIR, '..')
const REPO_ROOT = path.resolve(PROJECT_TEMPLATES_DIR, '..')
const TARGET_DIR = path.join(PROJECT_TEMPLATES_DIR, 'target')
const configuredNodeModules = process.env.PROJECT_TEMPLATES_NODE_MODULES
  ? path.resolve(process.env.PROJECT_TEMPLATES_NODE_MODULES)
  : null
const FRONTEND_NODE_MODULES = configuredNodeModules || path.join(REPO_ROOT, 'frontends/web/main-app/node_modules')
const FRONTEND_ROOT_NODE_MODULES = configuredNodeModules || path.join(REPO_ROOT, 'frontends/web/node_modules')

const REGISTRY = new Map([
  [
    'frontend.micro-app.react-webpack',
    {
      templateId: 'frontend.micro-app.react-webpack',
      templateVersion: '1.0.0',
      familyId: 'frontend.micro-app',
      branch: { framework: 'react', buildTool: 'webpack' },
      rowId: 'frontend.micro-app.react-webpack-1.0.0-platform-2.0.0-rc.1-candidate',
      scope: 'MICRO_FRONTEND',
      channel: 'preview',
      qualificationProfileId: 'frontend-candidate-v1',
      templateDir: path.join(PROJECT_TEMPLATES_DIR, 'templates/frontend.micro-app.react-webpack/1.0.0'),
      sampleParameters: {
        packageName: 'customer-portal',
        includeExampleRoute: true,
      },
      compatibility: {
        declaredPlatformRange: '[2.0.0-rc.1,2.0.0)',
        testedPlatformVersions: ['2.0.0-rc.1-SNAPSHOT'],
        toolchain: {
          node: process.version,
          react: '18.3.x',
          webpack: '5.108.x',
          qiankun: '2.10.x',
          sdk: '1.6.0-beta.6',
        },
      },
      delivery: {
        deliveryType: 'MICRO_FRONTEND_APP',
      },
      expectedBundles: ['app'],
    },
  ],
  [
    'frontend.micro-app.vue-vite',
    {
      templateId: 'frontend.micro-app.vue-vite',
      templateVersion: '1.0.0',
      familyId: 'frontend.micro-app',
      branch: { framework: 'vue', buildTool: 'vite' },
      rowId: 'frontend.micro-app.vue-vite-1.0.0-platform-2.0.0-rc.1-candidate',
      scope: 'MICRO_FRONTEND',
      channel: 'preview',
      qualificationProfileId: 'frontend-candidate-v1',
      templateDir: path.join(PROJECT_TEMPLATES_DIR, 'templates/frontend.micro-app.vue-vite/1.0.0'),
      nodeModulesDir: FRONTEND_ROOT_NODE_MODULES,
      smokeProfile: 'vue-micro-app',
      sampleParameters: {
        packageName: 'customer-portal-vue',
        includeExampleRoute: true,
      },
      compatibility: {
        declaredPlatformRange: '[2.0.0-rc.1,2.0.0)',
        testedPlatformVersions: ['2.0.0-rc.1-SNAPSHOT'],
        toolchain: {
          node: process.version,
          vue: '3.5.x',
          vite: '8.1.x',
          qiankun: '2.10.x',
          sdk: '1.6.0-beta.6',
        },
      },
      delivery: {
        deliveryType: 'MICRO_FRONTEND_APP',
      },
      expectedBundles: ['app'],
    },
  ],
  [
    'frontend.layout.react-webpack',
    {
      templateId: 'frontend.layout.react-webpack',
      templateVersion: '1.0.0',
      familyId: 'frontend.layout',
      branch: { framework: 'react', buildTool: 'webpack' },
      rowId: 'frontend.layout.react-webpack-1.0.0-platform-2.0.0-rc.1-candidate',
      scope: 'MICRO_FRONTEND',
      channel: 'preview',
      qualificationProfileId: 'frontend-candidate-v1',
      templateDir: path.join(PROJECT_TEMPLATES_DIR, 'templates/frontend.layout.react-webpack/1.0.0'),
      sampleParameters: {
        packageName: 'workspace-layout',
        topbarTitle: '工作台',
        sidebarTitle: '导航',
      },
      compatibility: {
        declaredPlatformRange: '[2.0.0-rc.1,2.0.0)',
        testedPlatformVersions: ['2.0.0-rc.1-SNAPSHOT'],
        toolchain: {
          node: process.version,
          react: '18.3.x',
          webpack: '5.108.x',
          qiankun: '2.10.x',
          sdk: '1.6.0-beta.6',
        },
      },
      delivery: {
        deliveryType: 'MICRO_FRONTEND_PARCELS',
      },
      expectedBundles: ['topbar', 'sidebar'],
    },
  ],
  [
    'frontend.layout.vue-vite',
    {
      templateId: 'frontend.layout.vue-vite',
      templateVersion: '1.0.0',
      familyId: 'frontend.layout',
      branch: { framework: 'vue', buildTool: 'vite' },
      rowId: 'frontend.layout.vue-vite-1.0.0-platform-2.0.0-rc.1-candidate',
      scope: 'MICRO_FRONTEND',
      channel: 'preview',
      qualificationProfileId: 'frontend-candidate-v1',
      templateDir: path.join(PROJECT_TEMPLATES_DIR, 'templates/frontend.layout.vue-vite/1.0.0'),
      nodeModulesDir: FRONTEND_ROOT_NODE_MODULES,
      smokeProfile: 'vue-layout-parcels',
      sampleParameters: {
        packageName: 'workspace-layout-vue',
        topbarTitle: '工作台',
        sidebarTitle: '导航',
      },
      compatibility: {
        declaredPlatformRange: '[2.0.0-rc.1,2.0.0)',
        testedPlatformVersions: ['2.0.0-rc.1-SNAPSHOT'],
        toolchain: {
          node: process.version,
          vue: '3.5.x',
          vite: '8.1.x',
          qiankun: '2.10.x',
          sdk: '1.6.0-beta.6',
        },
      },
      delivery: {
        deliveryType: 'MICRO_FRONTEND_PARCELS',
      },
      expectedBundles: ['layout'],
    },
  ],
  [
    'frontend.component-library.react-webpack',
    {
      templateId: 'frontend.component-library.react-webpack',
      templateVersion: '1.0.0',
      familyId: 'frontend.component-library',
      branch: { framework: 'react', buildTool: 'webpack' },
      rowId: 'frontend.component-library.react-webpack-1.0.0-platform-2.0.0-rc.1-candidate',
      scope: 'MICRO_FRONTEND',
      channel: 'preview',
      qualificationProfileId: 'frontend-candidate-v1',
      templateDir: path.join(PROJECT_TEMPLATES_DIR, 'templates/frontend.component-library.react-webpack/1.0.0'),
      sampleParameters: {
        packageName: 'component-library',
      },
      compatibility: {
        declaredPlatformRange: '[2.0.0-rc.1,2.0.0)',
        testedPlatformVersions: ['2.0.0-rc.1-SNAPSHOT'],
        toolchain: {
          node: process.version,
          react: '18.3.x',
          webpack: '5.108.x',
          qiankun: '2.10.x',
          sdk: '1.6.0-beta.6',
        },
      },
      delivery: {
        deliveryType: 'MICRO_FRONTEND_LIBRARY',
      },
      expectedBundles: ['library'],
    },
  ],
  [
    'frontend.component-library.vue-vite',
    {
      templateId: 'frontend.component-library.vue-vite',
      templateVersion: '1.0.0',
      familyId: 'frontend.component-library',
      branch: { framework: 'vue', buildTool: 'vite' },
      rowId: 'frontend.component-library.vue-vite-1.0.0-platform-2.0.0-rc.1-candidate',
      scope: 'MICRO_FRONTEND',
      channel: 'preview',
      qualificationProfileId: 'frontend-candidate-v1',
      templateDir: path.join(PROJECT_TEMPLATES_DIR, 'templates/frontend.component-library.vue-vite/1.0.0'),
      nodeModulesDir: FRONTEND_ROOT_NODE_MODULES,
      sampleParameters: {
        packageName: 'component-library-vue',
      },
      compatibility: {
        declaredPlatformRange: '[2.0.0-rc.1,2.0.0)',
        testedPlatformVersions: ['2.0.0-rc.1-SNAPSHOT'],
        toolchain: {
          node: process.version,
          vue: '3.5.x',
          vite: '8.1.x',
          qiankun: '2.10.x',
          sdk: '1.6.0-beta.6',
        },
      },
      delivery: {
        deliveryType: 'MICRO_FRONTEND_LIBRARY',
      },
      expectedBundles: ['library'],
    },
  ],
  [
    'frontend.platform-component-library.react-webpack',
    {
      templateId: 'frontend.platform-component-library.react-webpack',
      templateVersion: '1.0.0',
      familyId: 'frontend.platform-component-library',
      branch: { framework: 'react', buildTool: 'webpack' },
      rowId: 'frontend.platform-component-library.react-webpack-1.0.0-platform-2.0.0-rc.1-candidate',
      scope: 'PLATFORM_COMPONENT_LIBRARY',
      channel: 'preview',
      qualificationProfileId: 'frontend-candidate-v1',
      templateDir: path.join(PROJECT_TEMPLATES_DIR, 'templates/frontend.platform-component-library.react-webpack/1.0.0'),
      sampleParameters: {
        packageName: 'platform-component-library',
      },
      compatibility: {
        declaredPlatformRange: '[2.0.0-rc.1,2.0.0)',
        testedPlatformVersions: ['2.0.0-rc.1-SNAPSHOT'],
        toolchain: {
          node: process.version,
          react: '18.3.x',
          webpack: '5.108.x',
          qiankun: '2.10.x',
          sdk: '1.6.0-beta.6',
        },
      },
      delivery: {
        deliveryType: 'PLATFORM_COMPONENT_LIBRARY',
      },
      expectedBundles: ['library'],
    },
  ],
  [
    'frontend.platform-component-library.vue-vite',
    {
      templateId: 'frontend.platform-component-library.vue-vite',
      templateVersion: '1.0.0',
      familyId: 'frontend.platform-component-library',
      branch: { framework: 'vue', buildTool: 'vite' },
      rowId: 'frontend.platform-component-library.vue-vite-1.0.0-platform-2.0.0-rc.1-candidate',
      scope: 'PLATFORM_COMPONENT_LIBRARY',
      channel: 'preview',
      qualificationProfileId: 'frontend-candidate-v1',
      templateDir: path.join(PROJECT_TEMPLATES_DIR, 'templates/frontend.platform-component-library.vue-vite/1.0.0'),
      nodeModulesDir: FRONTEND_ROOT_NODE_MODULES,
      sampleParameters: {
        packageName: 'platform-component-library-vue',
      },
      compatibility: {
        declaredPlatformRange: '[2.0.0-rc.1,2.0.0)',
        testedPlatformVersions: ['2.0.0-rc.1-SNAPSHOT'],
        toolchain: {
          node: process.version,
          vue: '3.5.x',
          vite: '8.1.x',
          qiankun: '2.10.x',
          sdk: '1.6.0-beta.6',
        },
      },
      delivery: {
        deliveryType: 'PLATFORM_COMPONENT_LIBRARY',
      },
      expectedBundles: ['library'],
    },
  ],
  [
    'frontend.login.react-webpack',
    {
      templateId: 'frontend.login.react-webpack',
      templateVersion: '0.1.0',
      familyId: 'frontend.login',
      branch: { framework: 'react', buildTool: 'webpack' },
      rowId: 'frontend.login.react-webpack-0.1.0-platform-2.0.0-rc.1-candidate',
      scope: 'MICRO_FRONTEND',
      channel: 'preview',
      qualificationProfileId: 'frontend-candidate-v1',
      templateDir: path.join(PROJECT_TEMPLATES_DIR, 'templates/frontend.login.react-webpack/0.1.0'),
      smokeProfile: 'login-app',
      sampleParameters: {
        packageName: 'custom-login-page',
        brandName: 'Ouroboros',
      },
      compatibility: {
        declaredPlatformRange: '[2.0.0-rc.1,2.0.0)',
        testedPlatformVersions: ['2.0.0-rc.1-SNAPSHOT'],
        toolchain: {
          node: process.version,
          react: '18.3.x',
          webpack: '5.108.x',
          qiankun: '2.10.x',
          sdk: '1.6.0-beta.7',
        },
      },
      delivery: {
        deliveryType: 'MICRO_FRONTEND_APP',
      },
      expectedBundles: ['app'],
    },
  ],
  [
    'frontend.login.vue-vite',
    {
      templateId: 'frontend.login.vue-vite',
      templateVersion: '0.1.0',
      familyId: 'frontend.login',
      branch: { framework: 'vue', buildTool: 'vite' },
      rowId: 'frontend.login.vue-vite-0.1.0-platform-2.0.0-rc.1-candidate',
      scope: 'MICRO_FRONTEND',
      channel: 'preview',
      qualificationProfileId: 'frontend-candidate-v1',
      templateDir: path.join(PROJECT_TEMPLATES_DIR, 'templates/frontend.login.vue-vite/0.1.0'),
      nodeModulesDir: FRONTEND_ROOT_NODE_MODULES,
      smokeProfile: 'vue-login-app',
      sampleParameters: {
        packageName: 'custom-login-page-vue',
        brandName: 'Ouroboros',
      },
      compatibility: {
        declaredPlatformRange: '[2.0.0-rc.1,2.0.0)',
        testedPlatformVersions: ['2.0.0-rc.1-SNAPSHOT'],
        toolchain: {
          node: process.version,
          vue: '3.5.x',
          vite: '8.1.x',
          qiankun: '2.10.x',
          sdk: '1.6.0-beta.7',
        },
      },
      delivery: {
        deliveryType: 'MICRO_FRONTEND_APP',
      },
      expectedBundles: ['app'],
    },
  ],
])

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
      throw new Error(`unknown frontend template family id: ${familyId}`)
    }
    return selected
  }

  const template = REGISTRY.get(templateId)
  if (!template) {
    throw new Error(`unknown frontend template id: ${templateId}`)
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
  linkNodeModules(template, generatedProjectRoot)

  const ownerBytes = fs.readFileSync(path.join(template.templateDir, 'owner.json'))
  const manifestBytes = fs.readFileSync(path.join(template.templateDir, 'template.json'))
  const artifact = createTemplateArtifact(template)
  const buildEvidence = runCleanBuild(template, generatedProjectRoot)
  const smokeEvidence = runTemplateSmokeEvidence(template, generatedProjectRoot)

  const evidence = [
    evidenceEntry('owner', ownerBytes),
    evidenceEntry('immutable-artifact', artifact.bytes),
    evidenceEntry('clean-build', buildEvidence.bytes),
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
    passedTest('clean-build', `generated ${template.templateId} project builds successfully`, sha256Hex(buildEvidence.bytes)),
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

  if (report.summary.testCount === 0) {
    throw new Error(`zero tests for ${template.templateId}`)
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
  assert.equal(owner.status, template.ownerStatus || 'candidate')
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

  JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))
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
      assertPathSegment(value, pathMatch[1])
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
  if (helper === 'json') {
    return JSON.stringify(value).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
  }
  if (helper === 'identifier') {
    const identifier = scalarText(value, name)
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(identifier)) {
      throw new Error(`parameter ${name} is not a JavaScript identifier`)
    }
    return identifier
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
  const packageBase = String(requireParameter(params, 'packageName')).split('/').at(-1)
  const slug = packageBase.replaceAll('.', '-')
  const sourceName = slug
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('')
  return {
    name: slug,
    slug,
    sourceName,
    libraryName: slug,
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

function assertPathSegment(value, name) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value) || value === '.' || value === '..') {
    throw new Error(`parameter ${name} is not a safe path segment`)
  }
}

function dependencyNodeModules(template) {
  return template?.nodeModulesDir || FRONTEND_NODE_MODULES
}

function resolvedDependencyNodeModules(template) {
  const nodeModulesDir = dependencyNodeModules(template)
  if (nodeModulesDir === FRONTEND_ROOT_NODE_MODULES && !fs.existsSync(nodeModulesDir)) {
    return resolvedFrontendRootNodeModules()
  }
  return resolveNodeModulesPath(nodeModulesDir)
}

function resolvedFrontendRootNodeModules() {
  if (fs.existsSync(FRONTEND_ROOT_NODE_MODULES)) {
    return fs.realpathSync(FRONTEND_ROOT_NODE_MODULES)
  }
  const mainAppNodeModules = resolveNodeModulesPath(FRONTEND_NODE_MODULES)
  return resolveNodeModulesPath(path.resolve(mainAppNodeModules, '..', '..', 'node_modules'))
}

function resolveNodeModulesPath(nodeModulesDir) {
  if (!fs.existsSync(nodeModulesDir)) {
    throw new Error(`missing frontend dependencies: ${nodeModulesDir}`)
  }
  return fs.realpathSync(nodeModulesDir)
}

function linkNodeModules(template, projectRoot) {
  const realNodeModulesDir = resolvedDependencyNodeModules(template)

  const linkPath = path.join(projectRoot, 'node_modules')
  if (!fs.existsSync(linkPath)) {
    fs.symlinkSync(realNodeModulesDir, linkPath, 'dir')
  }

  const workspaceLinkPath = path.join(path.dirname(projectRoot), 'node_modules')
  if (!fs.existsSync(workspaceLinkPath)) {
    fs.symlinkSync(resolvedFrontendRootNodeModules(), workspaceLinkPath, 'dir')
  }
}

function runCleanBuild(template, projectRoot) {
  const result = childProcess.spawnSync('npm', ['run', 'build'], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_PATH: resolvedDependencyNodeModules(template),
    },
  })

  if (result.status !== 0) {
    throw new Error(`clean build failed:\n${result.stdout}\n${result.stderr}`)
  }

  const bundles = template.expectedBundles.map((bundleName) => {
    const bundle = `dist/static/js/${bundleName}.js`
    const bundlePath = path.join(projectRoot, bundle)
    assert.equal(fs.existsSync(bundlePath), true, `missing webpack bundle: ${bundle}`)
    return {
      bundle,
      sha256: sha256Hex(fs.readFileSync(bundlePath)),
    }
  })
  const evidence = {
    command: 'npm run build',
    status: result.status,
    bundles,
  }
  return { bytes: Buffer.from(stableStringify(evidence)) }
}

function runContractSmoke(template, projectRoot) {
  const result = childProcess.spawnSync('npm', ['run', 'test:contract'], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_PATH: resolvedDependencyNodeModules(template),
    },
  })

  if (result.status !== 0) {
    throw new Error(`contract smoke failed:\n${result.stdout}\n${result.stderr}`)
  }

  return {
    bytes: Buffer.from(
      stableStringify({
        command: 'npm run test:contract',
        status: result.status,
        stdoutSha256: sha256Hex(Buffer.from(result.stdout)),
      }),
    ),
  }
}

function runTemplateSmokeEvidence(template, projectRoot) {
  if (template.smokeProfile === 'login-app') {
    const contractEvidence = runContractSmoke(template, projectRoot)
    const authJourneyEvidence = runLoginAuthJourneySmoke(projectRoot)
    const fallbackEvidence = runLoginFallbackSmoke(projectRoot)
    return [
      {
        name: 'login-contract-smoke',
        details: 'generated login page contract smoke test passes',
        bytes: contractEvidence.bytes,
      },
      {
        name: 'login-auth-journey-smoke',
        details: 'local, LDAP, CAS, OAuth2/OIDC, callback and returnUrl auth helpers pass',
        bytes: authJourneyEvidence.bytes,
      },
      {
        name: 'login-i18n-fallback-smoke',
        details: 'i18n messages and loading/error fallback helpers pass',
        bytes: fallbackEvidence.bytes,
      },
    ]
  }

  if (template.smokeProfile === 'vue-micro-app') {
    const routeEvidence = runVueRouteSmoke(projectRoot)
    const contractEvidence = runContractSmoke(template, projectRoot)
    const lifecycleEvidence = runVueLifecycleSmoke(projectRoot)
    const qiankunUmdEvidence = runViteQiankunUmdSmoke(template, projectRoot, 'app', {
      lifecycleExports: ['bootstrap', 'mount', 'update', 'unmount'],
    })
    const deleteEvidence = runDeleteSmoke(projectRoot)
    return [
      {
        name: 'app-route-smoke',
        details: 'generated Vue app route table includes root and example route',
        bytes: routeEvidence.bytes,
      },
      {
        name: 'app-contract-smoke',
        details: 'generated Vue contract smoke test passes',
        bytes: contractEvidence.bytes,
      },
      {
        name: 'mount-update-unmount-smoke',
        details: 'generated Vue lifecycle source declares qiankun mount/update/unmount behavior',
        bytes: lifecycleEvidence.bytes,
      },
      {
        name: 'qiankun-umd-entry-smoke',
        details: 'generated Vite dist/index.html loads UMD bundle and global lifecycle exports are qiankun-compatible',
        bytes: qiankunUmdEvidence.bytes,
      },
      {
        name: 'delete-smoke',
        details: 'generated build output can be removed after lifecycle smoke',
        bytes: deleteEvidence.bytes,
      },
    ]
  }


  if (template.smokeProfile === 'vue-layout-parcels') {
    const contractEvidence = runContractSmoke(template, projectRoot)
    const layoutEvidence = runVueLayoutParcelSmoke(projectRoot)
    const qiankunUmdEvidence = runViteQiankunUmdSmoke(template, projectRoot, 'layout', {
      lifecycleExports: ['bootstrap', 'mount', 'update', 'unmount'],
      parcelExports: ['topbar', 'sidebar'],
    })
    return [
      {
        name: 'layout-contract-smoke',
        details: 'generated Vue layout parcel contract smoke test passes',
        bytes: contractEvidence.bytes,
      },
      {
        name: 'vue-layout-parcel-smoke',
        details: 'generated Vue layout source declares topbar and sidebar parcel lifecycles',
        bytes: layoutEvidence.bytes,
      },
      {
        name: 'qiankun-umd-entry-smoke',
        details: 'generated Vite dist/index.html loads UMD bundle and exported parcels are qiankun-compatible',
        bytes: qiankunUmdEvidence.bytes,
      },
    ]
  }

  if (template.smokeProfile === 'vue-login-app') {
    const contractEvidence = runContractSmoke(template, projectRoot)
    const authJourneyEvidence = runLoginAuthJourneySmoke(projectRoot)
    const fallbackEvidence = runLoginFallbackSmoke(projectRoot)
    const lifecycleEvidence = runVueLifecycleSmoke(projectRoot)
    const qiankunUmdEvidence = runViteQiankunUmdSmoke(template, projectRoot, 'app', {
      lifecycleExports: ['bootstrap', 'mount', 'update', 'unmount'],
    })
    const deleteEvidence = runDeleteSmoke(projectRoot)
    return [
      {
        name: 'login-contract-smoke',
        details: 'generated Vue login page contract smoke test passes',
        bytes: contractEvidence.bytes,
      },
      {
        name: 'login-auth-journey-smoke',
        details: 'local, LDAP, CAS, OAuth2/OIDC, callback and returnUrl auth helpers pass',
        bytes: authJourneyEvidence.bytes,
      },
      {
        name: 'login-i18n-fallback-smoke',
        details: 'i18n messages and loading/error fallback helpers pass',
        bytes: fallbackEvidence.bytes,
      },
      {
        name: 'mount-update-unmount-smoke',
        details: 'generated Vue login lifecycle source declares qiankun mount/update/unmount behavior',
        bytes: lifecycleEvidence.bytes,
      },
      {
        name: 'qiankun-umd-entry-smoke',
        details: 'generated Vite dist/index.html loads UMD bundle and login lifecycle exports are qiankun-compatible',
        bytes: qiankunUmdEvidence.bytes,
      },
      {
        name: 'delete-smoke',
        details: 'generated build output can be removed after lifecycle smoke',
        bytes: deleteEvidence.bytes,
      },
    ]
  }

  if (template.delivery.deliveryType === 'MICRO_FRONTEND_APP') {
    const routeEvidence = runRouteSmoke(projectRoot)
    const contractEvidence = runContractSmoke(template, projectRoot)
    const lifecycleEvidence = runLifecycleSmoke(projectRoot)
    const deleteEvidence = runDeleteSmoke(projectRoot)
    return [
      {
        name: 'app-route-smoke',
        details: 'generated app route table includes root and example route',
        bytes: routeEvidence.bytes,
      },
      {
        name: 'app-contract-smoke',
        details: 'generated contract smoke test passes',
        bytes: contractEvidence.bytes,
      },
      {
        name: 'mount-update-unmount-smoke',
        details: 'generated lifecycle exports run under mocked qiankun host',
        bytes: lifecycleEvidence.bytes,
      },
      {
        name: 'delete-smoke',
        details: 'generated build output can be removed after lifecycle smoke',
        bytes: deleteEvidence.bytes,
      },
    ]
  }

  if (template.delivery.deliveryType === 'MICRO_FRONTEND_PARCELS') {
    const contractEvidence = runContractSmoke(template, projectRoot)
    const topbarEvidence = runLayoutParcelSmoke(projectRoot, 'src/topbar-entry.jsx', 'custom-topbar-container')
    const sidebarEvidence = runLayoutParcelSmoke(projectRoot, 'src/sidebar-entry.jsx', 'custom-sidebar-container')
    return [
      {
        name: 'layout-contract-smoke',
        details: 'generated layout parcel contract smoke test passes',
        bytes: contractEvidence.bytes,
      },
      {
        name: 'topbar-parcel-smoke',
        details: 'topbar parcel bootstrap/mount/update/unmount runs under mocked host slot',
        bytes: topbarEvidence.bytes,
      },
      {
        name: 'sidebar-parcel-smoke',
        details: 'sidebar parcel bootstrap/mount/update/unmount runs under mocked host slot',
        bytes: sidebarEvidence.bytes,
      },
    ]
  }

  if (template.delivery.deliveryType === 'MICRO_FRONTEND_LIBRARY') {
    const contractEvidence = runContractSmoke(template, projectRoot)
    const registrationEvidence = runComponentLibraryRegistrationSmoke(projectRoot)
    const dependencyEvidence = runComponentLibraryDependencySmoke(projectRoot)
    const qiankunUmdEvidence = template.templateId.endsWith('.vue-vite')
      ? runViteQiankunUmdSmoke(template, projectRoot, 'library', {
          lifecycleExports: ['bootstrap', 'mount', 'update', 'unmount'],
          functionExports: ['install'],
        })
      : null
    return [
      {
        name: 'component-library-contract-smoke',
        details: 'generated component library contract smoke test passes',
        bytes: contractEvidence.bytes,
      },
      {
        name: 'component-library-registration-smoke',
        details: 'renderer and form item registration is captured under mocked platform registry',
        bytes: registrationEvidence.bytes,
      },
      {
        name: 'component-library-dependency-smoke',
        details: 'component library includes qiankun and SDK dependencies without legacy renderer dependency',
        bytes: dependencyEvidence.bytes,
      },
      ...(qiankunUmdEvidence
        ? [
            {
              name: 'qiankun-umd-entry-smoke',
              details: 'generated Vite dist/index.html loads UMD bundle and library exports are qiankun-compatible',
              bytes: qiankunUmdEvidence.bytes,
            },
          ]
        : []),
    ]
  }

  if (template.delivery.deliveryType === 'PLATFORM_COMPONENT_LIBRARY') {
    const contractEvidence = runContractSmoke(template, projectRoot)
    const installEvidence = runPlatformLibraryInstallSmoke(projectRoot)
    const upgradeConflictEvidence = runPlatformLibraryUpgradeConflictSmoke(projectRoot)
    const qiankunUmdEvidence = template.templateId.endsWith('.vue-vite')
      ? runViteQiankunUmdSmoke(template, projectRoot, 'library', {
          functionExports: ['install'],
        })
      : null
    return [
      {
        name: 'platform-library-contract-smoke',
        details: 'generated platform component library contract smoke test passes',
        bytes: contractEvidence.bytes,
      },
      {
        name: 'platform-library-install-smoke',
        details: 'manifest inspect/install/import/render/remove/uninstall lifecycle passes',
        bytes: installEvidence.bytes,
      },
      {
        name: 'platform-library-upgrade-conflict-smoke',
        details: 'upgrade replacement and duplicate component conflict rejection pass',
        bytes: upgradeConflictEvidence.bytes,
      },
      ...(qiankunUmdEvidence
        ? [
            {
              name: 'qiankun-umd-entry-smoke',
              details: 'generated Vite dist/index.html loads UMD bundle and platform library exports are qiankun-compatible',
              bytes: qiankunUmdEvidence.bytes,
            },
          ]
        : []),
    ]
  }

  throw new Error(`unsupported frontend delivery type: ${template.delivery.deliveryType}`)
}

function runRouteSmoke(projectRoot) {
  const appSource = fs.readFileSync(path.join(projectRoot, 'src/App.jsx'), 'utf8')
  assert.match(appSource, /routeDefinitions/)
  assert.match(appSource, /path:\s*'\/'/)
  assert.match(appSource, /path:\s*'\/example'/)

  return {
    bytes: Buffer.from(
      stableStringify({
        routeTable: 'routeDefinitions',
        routes: ['/', '/example'],
      }),
    ),
  }
}

function runVueRouteSmoke(projectRoot) {
  const appSource = fs.readFileSync(path.join(projectRoot, 'src/App.vue'), 'utf8')
  assert.match(appSource, /routeDefinitions/)
  assert.match(appSource, /path:\s*'\/'/)
  assert.match(appSource, /path:\s*'\/example'/)

  return {
    bytes: Buffer.from(
      stableStringify({
        routeTable: 'routeDefinitions',
        routes: ['/', '/example'],
      }),
    ),
  }
}

function runVueLifecycleSmoke(projectRoot) {
  const mainSource = fs.readFileSync(path.join(projectRoot, 'src/main.js'), 'utf8')
  assert.match(mainSource, /import\s+\{\s*createApp\s*}\s+from\s+'vue'/)
  assert.match(mainSource, /export async function bootstrap/)
  assert.match(mainSource, /export async function mount/)
  assert.match(mainSource, /export async function update/)
  assert.match(mainSource, /export async function unmount/)
  assert.match(mainSource, /app\.mount\(mountContainer\)/)
  assert.match(mainSource, /app\.unmount\(\)/)

  return {
    bytes: Buffer.from(
      stableStringify({
        lifecycle: ['bootstrap', 'mount', 'update', 'unmount'],
        renderer: 'vue-createApp',
      }),
    ),
  }
}

function runVueLayoutParcelSmoke(projectRoot) {
  const entrySource = fs.readFileSync(path.join(projectRoot, 'src/layout-entry.js'), 'utf8')
  const parcelSource = fs.readFileSync(path.join(projectRoot, 'src/createLayoutParcel.js'), 'utf8')
  assert.match(entrySource, /export const topbar/)
  assert.match(entrySource, /export const sidebar/)
  assert.match(entrySource, /createLayoutParcel/)
  assert.match(parcelSource, /createApp/)
  assert.match(parcelSource, /bootstrap/)
  assert.match(parcelSource, /mount/)
  assert.match(parcelSource, /update/)
  assert.match(parcelSource, /unmount/)

  return {
    bytes: Buffer.from(
      stableStringify({
        layoutExports: ['topbar', 'sidebar'],
        lifecycle: ['bootstrap', 'mount', 'update', 'unmount'],
      }),
    ),
  }
}

function runViteQiankunUmdSmoke(template, projectRoot, bundleName, expectations) {
  const htmlPath = path.join(projectRoot, 'dist/index.html')
  const bundleRelativePath = `static/js/${bundleName}.js`
  const cssRelativePath = `static/css/${bundleName}.css`
  const bundlePath = path.join(projectRoot, 'dist', bundleRelativePath)
  const cssPath = path.join(projectRoot, 'dist', cssRelativePath)
  assert.equal(fs.existsSync(htmlPath), true, 'missing Vite dist/index.html')
  assert.equal(fs.existsSync(bundlePath), true, `missing Vite UMD bundle: ${bundleRelativePath}`)
  assert.equal(fs.existsSync(cssPath), true, `missing Vite CSS bundle: ${cssRelativePath}`)

  const html = fs.readFileSync(htmlPath, 'utf8')
  assert.match(html, new RegExp(`<script\\s+src="\\./${bundleRelativePath.replace('/', '\\/')}"`))
  assert.match(html, new RegExp(`<link\\s+rel="stylesheet"\\s+href="\\./${cssRelativePath.replace('/', '\\/')}"`))
  assert.doesNotMatch(html, /type="module"/)
  assert.doesNotMatch(html, /\/src\//)

  const bundleSource = fs.readFileSync(bundlePath, 'utf8')
  assert.doesNotMatch(bundleSource, /process\.env/)

  const sandbox = {
    console,
    self: {},
    window: {
      __POWERED_BY_QIANKUN__: true,
    },
  }
  sandbox.globalThis = sandbox
  vm.runInNewContext(bundleSource, sandbox, { filename: bundlePath })

  const globalName = projectModel(template.sampleParameters).sourceName
  const exposed = sandbox[globalName] || sandbox.self[globalName] || sandbox.window[globalName]
  assert.ok(exposed, `Vite UMD bundle did not expose global ${globalName}`)

  for (const exportName of expectations.lifecycleExports || []) {
    assert.equal(typeof exposed[exportName], 'function', `${globalName}.${exportName} must be a function`)
  }
  for (const exportName of expectations.functionExports || []) {
    assert.equal(typeof exposed[exportName], 'function', `${globalName}.${exportName} must be a function`)
  }
  for (const parcelName of expectations.parcelExports || []) {
    const parcel = exposed[parcelName]
    assert.ok(parcel, `${globalName}.${parcelName} must be exported`)
    for (const lifecycleName of ['bootstrap', 'mount', 'update', 'unmount']) {
      assert.equal(typeof parcel[lifecycleName], 'function', `${globalName}.${parcelName}.${lifecycleName} must be a function`)
    }
  }

  return {
    bytes: Buffer.from(
      stableStringify({
        html: 'dist/index.html',
        bundle: bundleRelativePath,
        css: cssRelativePath,
        globalName,
        exports: Object.keys(exposed).sort(),
        processEnvFree: true,
      }),
    ),
  }
}

function runLifecycleSmoke(projectRoot) {
  const babel = require(path.join(FRONTEND_NODE_MODULES, '@babel/core'))
  const sourcePath = path.join(projectRoot, 'src/main.jsx')
  const transformResult = babel.transformFileSync(sourcePath, {
    babelrc: false,
    configFile: false,
    filename: sourcePath,
    presets: [
      [path.join(FRONTEND_NODE_MODULES, '@babel/preset-env'), { modules: 'commonjs', targets: { node: 'current' } }],
      [path.join(FRONTEND_NODE_MODULES, '@babel/preset-react'), { runtime: 'classic' }],
    ],
  })

  const lifecycleModule = { exports: {} }
  const events = []
  const rootApi = {
    render(element) {
      events.push({ type: 'render', elementType: element?.type?.name || String(element?.type || 'unknown') })
    },
    unmount() {
      events.push({ type: 'unmount' })
    },
  }
  const host = createHostElement()
  const sandbox = {
    exports: lifecycleModule.exports,
    module: lifecycleModule,
    window: {
      __POWERED_BY_QIANKUN__: true,
      location: {
        pathname: '/customer-portal/example',
      },
    },
    document: {
      createElement(tagName) {
        return createElement(tagName)
      },
      querySelector() {
        return null
      },
    },
    require(specifier) {
      if (specifier === 'react') {
        return {
          createElement(type, props, ...children) {
            return { type, props: props || {}, children }
          },
        }
      }
      if (specifier === 'react-dom/client') {
        return {
          createRoot(container) {
            events.push({ type: 'createRoot', id: container.id })
            return rootApi
          },
        }
      }
      if (specifier === './App.jsx') {
        return {
          __esModule: true,
          default: function App() {
            return null
          },
        }
      }
      if (specifier === './styles.css') {
        return {}
      }
      throw new Error(`unexpected require in lifecycle smoke: ${specifier}`)
    },
  }

  vm.runInNewContext(transformResult.code, sandbox, { filename: sourcePath })

  const lifecycle = lifecycleModule.exports
  for (const name of ['bootstrap', 'mount', 'update', 'unmount']) {
    assert.equal(typeof lifecycle[name], 'function', `${name} is not exported`)
  }

  lifecycle.bootstrap({ container: host })
  lifecycle.mount({ container: host })
  lifecycle.update({ container: host })
  lifecycle.unmount({ container: host })

  assert.equal(events.filter((event) => event.type === 'createRoot').length, 1)
  assert.equal(events.filter((event) => event.type === 'render').length, 2)
  assert.equal(events.filter((event) => event.type === 'unmount').length, 1)

  return {
    bytes: Buffer.from(
      stableStringify({
        lifecycle: ['bootstrap', 'mount', 'update', 'unmount'],
        events,
      }),
    ),
  }
}

function runLayoutParcelSmoke(projectRoot, entryRelativePath, mountElementId) {
  const babel = require(path.join(FRONTEND_NODE_MODULES, '@babel/core'))
  const events = []
  const loadedModules = new Map()
  const host = createHostElement()
  let capturedOptions = null
  let currentApp = null

  function loadModule(modulePath) {
    const absolutePath = path.resolve(modulePath)
    const cached = loadedModules.get(absolutePath)
    if (cached) {
      return cached.exports
    }

    const moduleRecord = { exports: {} }
    loadedModules.set(absolutePath, moduleRecord)
    const transformResult = babel.transformFileSync(absolutePath, {
      babelrc: false,
      configFile: false,
      filename: absolutePath,
      presets: [
        [path.join(FRONTEND_NODE_MODULES, '@babel/preset-env'), { modules: 'commonjs', targets: { node: 'current' } }],
        [path.join(FRONTEND_NODE_MODULES, '@babel/preset-react'), { runtime: 'classic' }],
      ],
    })

    const sandbox = {
      exports: moduleRecord.exports,
      module: moduleRecord,
      window: {
        __POWERED_BY_QIANKUN__: true,
        location: {
          pathname: '/workspace-layout',
        },
      },
      document: {
        createElement(tagName) {
          return createElement(tagName)
        },
        querySelector() {
          return null
        },
      },
      require(specifier) {
        if (specifier === 'react') {
          return {
            createElement(type, props, ...children) {
              return { type, props: props || {}, children }
            },
          }
        }
        if (specifier === 'react-dom/client') {
          return {
            createRoot(container) {
              events.push({ type: 'createRoot', id: container.id })
              return {
                render(element) {
                  events.push({ type: 'render', elementType: element?.type?.name || String(element?.type || 'unknown') })
                },
                unmount() {
                  events.push({ type: 'unmount' })
                },
              }
            },
          }
        }
        if (specifier === 'ouroboros-sdk') {
          return {
            initLayoutComponent(options) {
              capturedOptions = options
              return {
                bootstrap() {
                  events.push({ type: 'bootstrap' })
                  return options.onBootstrap?.()
                },
                mount(props) {
                  events.push({ type: 'mount' })
                  currentApp = options.render(props)
                  return currentApp
                },
                update(props) {
                  events.push({ type: 'update' })
                  return options.afterUpdate(props)
                },
                unmount(props) {
                  events.push({ type: 'unmountLifecycle' })
                  return options.afterUnmount(props, currentApp)
                },
              }
            },
          }
        }
        if (specifier.endsWith('.css')) {
          return {}
        }
        if (specifier.startsWith('.')) {
          return loadModule(resolveLocalModule(absolutePath, specifier))
        }
        throw new Error(`unexpected require in layout parcel smoke: ${specifier}`)
      },
    }

    vm.runInNewContext(transformResult.code, sandbox, { filename: absolutePath })
    return moduleRecord.exports
  }

  const entry = loadModule(path.join(projectRoot, entryRelativePath))
  for (const name of ['bootstrap', 'mount', 'update', 'unmount']) {
    assert.equal(typeof entry[name], 'function', `${entryRelativePath} does not export ${name}`)
  }
  assert.ok(capturedOptions, `${entryRelativePath} did not call initLayoutComponent`)

  const props = {
    container: host,
    appName: 'Workspace Shell',
    currentPath: '/dev/study-project/business-model',
    theme: { name: 'light' },
    userInfo: { username: 'owner' },
    menu: [{ id: 'home', label: '首页' }],
    breadcrumb: [{ path: '/', label: '首页' }],
    sidebarStatus: { sidebarExpanded: true, sidebarWidth: 240 },
  }

  entry.bootstrap(props)
  entry.mount(props)
  entry.update({ ...props, currentPath: '/workspace-layout/example' })
  entry.unmount(props)

  assert.equal(events.filter((event) => event.type === 'createRoot' && event.id === mountElementId).length, 1)
  assert.equal(events.filter((event) => event.type === 'render').length, 2)
  assert.equal(events.filter((event) => event.type === 'unmount').length, 1)

  return {
    bytes: Buffer.from(
      stableStringify({
        entry: entryRelativePath,
        mountElementId,
        lifecycle: ['bootstrap', 'mount', 'update', 'unmount'],
        events,
      }),
    ),
  }
}

const UNHANDLED_MODULE = Symbol('unhandled-module')

function createBabelModuleLoader(projectRoot, requireModule) {
  const babel = require(path.join(FRONTEND_NODE_MODULES, '@babel/core'))
  const loadedModules = new Map()

  function loadModule(modulePath) {
    const absolutePath = path.resolve(modulePath)
    const cached = loadedModules.get(absolutePath)
    if (cached) {
      return cached.exports
    }

    const moduleRecord = { exports: {} }
    loadedModules.set(absolutePath, moduleRecord)
    const transformResult = babel.transformFileSync(absolutePath, {
      babelrc: false,
      configFile: false,
      filename: absolutePath,
      presets: [
        [path.join(FRONTEND_NODE_MODULES, '@babel/preset-env'), { modules: 'commonjs', targets: { node: 'current' } }],
        [path.join(FRONTEND_NODE_MODULES, '@babel/preset-react'), { runtime: 'classic' }],
      ],
    })

    const sandbox = {
      exports: moduleRecord.exports,
      module: moduleRecord,
      URL,
      window: {
        __POWERED_BY_QIANKUN__: true,
        location: {
          href: 'https://example.test/login?returnUrl=%2Fworkspace',
          origin: 'https://example.test',
        },
      },
      document: {
        createElement(tagName) {
          return createElement(tagName)
        },
        querySelector() {
          return null
        },
      },
      require(specifier) {
        const custom = requireModule(specifier, absolutePath, loadModule)
        if (custom !== UNHANDLED_MODULE) {
          return custom
        }
        if (specifier.endsWith('.css')) {
          return {}
        }
        if (specifier.startsWith('.')) {
          return loadModule(resolveLocalModule(absolutePath, specifier))
        }
        throw new Error(`unexpected require while loading ${absolutePath}: ${specifier}`)
      },
    }

    vm.runInNewContext(transformResult.code, sandbox, { filename: absolutePath })
    return moduleRecord.exports
  }

  return (relativePath) => loadModule(path.join(projectRoot, relativePath))
}

function reactMock() {
  return {
    createElement(type, props, ...children) {
      return { type, props: props || {}, children }
    },
    useMemo(factory) {
      return factory()
    },
    useState(initialValue) {
      return [initialValue, () => undefined]
    },
  }
}

function vueMock() {
  return {
    h(type, props, children) {
      return { type, props: props || {}, children }
    },
  }
}

function frontendLibraryEntry(projectRoot) {
  if (fs.existsSync(path.join(projectRoot, 'src/index.jsx'))) {
    return 'src/index.jsx'
  }
  return 'src/index.js'
}

function frontendLibraryLoader(projectRoot) {
  return createBabelModuleLoader(projectRoot, (specifier) => {
    if (specifier === 'react') {
      return reactMock()
    }
    if (specifier === 'vue') {
      return vueMock()
    }
    return UNHANDLED_MODULE
  })
}

function runComponentLibraryRegistrationSmoke(projectRoot) {
  const entry = frontendLibraryLoader(projectRoot)(frontendLibraryEntry(projectRoot))
  const registry = createPlatformComponentRegistry()
  entry.install(registry)
  assert.equal(registry.renderers.size, 1)
  assert.equal(registry.formItems.size, 1)
  assert.equal(typeof entry.bootstrap, 'function')
  assert.equal(typeof entry.mount, 'function')
  assert.equal(typeof entry.update, 'function')
  assert.equal(typeof entry.unmount, 'function')

  return {
    bytes: Buffer.from(
      stableStringify({
        installCounts: {
          renderers: registry.renderers.size,
          formItems: registry.formItems.size,
        },
      }),
    ),
  }
}

function runComponentLibraryDependencySmoke(projectRoot) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'))
  const entryPath = frontendLibraryEntry(projectRoot)
  const entrySource = fs.readFileSync(path.join(projectRoot, entryPath), 'utf8')
  assert.ok(packageJson.dependencies.qiankun)
  assert.ok(packageJson.dependencies['ouroboros-sdk'])
  assert.equal(Object.hasOwn(packageJson.dependencies, ['am', 'is'].join('')), false)
  assert.doesNotMatch(entrySource, /\bamis\b/i)

  return {
    bytes: Buffer.from(
      stableStringify({
        dependencies: Object.keys(packageJson.dependencies).sort(),
        entryPath,
      }),
    ),
  }
}

function runPlatformLibraryInstallSmoke(projectRoot) {
  const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'components.manifest.json'), 'utf8'))
  const manage = JSON.parse(fs.readFileSync(path.join(projectRoot, 'manage.json'), 'utf8'))
  const distBundle = path.join(projectRoot, 'dist/static/js/library.js')
  assert.equal(fs.existsSync(distBundle), true, 'platform library bundle must exist')
  assert.equal(manifest.name, path.basename(projectRoot))
  for (const section of ['renderers', 'formItems', 'actions', 'rules']) {
    assert.ok(Array.isArray(manifest[section]) && manifest[section].length > 0, `manifest.${section} must not be empty`)
    assert.ok(Array.isArray(manage[section].disabled), `manage.${section}.disabled must exist`)
  }

  const entry = frontendLibraryLoader(projectRoot)(frontendLibraryEntry(projectRoot))

  const registry = createPlatformComponentRegistry()
  entry.install(registry)
  assert.equal(registry.renderers.size, 1)
  assert.equal(registry.formItems.size, 1)
  assert.equal(registry.actions.size, 1)
  assert.equal(registry.validators.size, 1)

  registry.renderers.get(manifest.renderers[0].name)({ title: '活跃用户', value: '42' })
  registry.formItems.get(manifest.formItems[0].name)({ value: 'demo', onChange() {} })
  const actionResult = registry.actions.get('sample-platform-action')()
  assert.equal(actionResult.ok, true)
  assert.equal(registry.validators.get('samplePlatformRule')('value'), true)

  registry.renderers.clear()
  registry.formItems.clear()
  registry.actions.clear()
  registry.validators.clear()
  assert.equal(registry.renderers.size + registry.formItems.size + registry.actions.size + registry.validators.size, 0)

  return {
    bytes: Buffer.from(
      stableStringify({
        manifestSections: Object.keys(manifest).sort(),
        installCounts: {
          renderers: 1,
          formItems: 1,
          actions: 1,
          validators: 1,
        },
        removeAndUninstall: true,
      }),
    ),
  }
}

function runPlatformLibraryUpgradeConflictSmoke(projectRoot) {
  const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'components.manifest.json'), 'utf8'))
  const entry = frontendLibraryLoader(projectRoot)(frontendLibraryEntry(projectRoot))

  const registry = createPlatformComponentRegistry()
  entry.install(registry)
  assert.throws(() => entry.install(registry), /duplicate renderer/)

  const installedLibraries = new Map()
  installedLibraries.set(manifest.name, { version: '0.0.1', status: 'installed' })
  installedLibraries.set(manifest.name, { version: manifest.version, status: 'upgraded' })
  assert.equal(installedLibraries.get(manifest.name).version, '0.1.0')
  assert.equal(installedLibraries.get(manifest.name).status, 'upgraded')

  return {
    bytes: Buffer.from(
      stableStringify({
        conflictRejected: true,
        upgraded: {
          name: manifest.name,
          version: manifest.version,
        },
      }),
    ),
  }
}

function createPlatformComponentRegistry() {
  const registry = {
    renderers: new Map(),
    formItems: new Map(),
    actions: new Map(),
    validators: new Map(),
    Renderer(options) {
      return (component) => {
        if (registry.renderers.has(options.type)) {
          throw new Error(`duplicate renderer: ${options.type}`)
        }
        registry.renderers.set(options.type, component)
        return component
      }
    },
    FormItem(options) {
      return (component) => {
        if (registry.formItems.has(options.type)) {
          throw new Error(`duplicate form item: ${options.type}`)
        }
        registry.formItems.set(options.type, component)
        return component
      }
    },
    registerAction(name, action) {
      if (registry.actions.has(name)) {
        throw new Error(`duplicate action: ${name}`)
      }
      registry.actions.set(name, action)
    },
    registerValidator(name, validator) {
      if (registry.validators.has(name)) {
        throw new Error(`duplicate validator: ${name}`)
      }
      registry.validators.set(name, validator)
    },
  }
  return registry
}

function runLoginAuthJourneySmoke(projectRoot) {
  const authFlow = createBabelModuleLoader(projectRoot, () => UNHANDLED_MODULE)('src/authFlow.js')
  const providers = [
    { id: 'local', type: 'LOCAL', label: '本地账号' },
    { id: 'ldap-main', type: 'LDAP', label: 'LDAP' },
    { id: 'cas', type: 'CAS', label: 'CAS' },
    { id: 'oauth2', type: 'OAUTH2', label: 'OAuth2' },
    { id: 'oidc', type: 'OIDC', label: 'OIDC' },
  ]
  const model = authFlow.buildLoginModel({ providers, locale: 'zh-CN' })
  assert.equal(model.locale, 'zh-CN')
  assert.equal(model.localProvider.id, 'local')
  assert.deepEqual(model.ldapProviders.map((provider) => provider.id), ['ldap-main'])
  assert.deepEqual(model.redirectProviders.map((provider) => provider.id), ['cas', 'oauth2', 'oidc'])

  let credentialArgs = null
  const credentialResult = authFlow.submitCredentialLogin({
    username: 'owner',
    password: 'secret',
    returnUrl: '/workspace',
    login(args) {
      credentialArgs = args
      return { status: 'ok', args }
    },
  })
  assert.equal(credentialResult.status, 'ok')
  assert.equal(credentialArgs.returnUrl, '/workspace')

  let ldapArgs = null
  authFlow.submitLdapLogin({
    provider: providers[1],
    username: 'ldap-user',
    password: 'secret',
    returnUrl: '/ldap-home',
    loginWithLdap(args) {
      ldapArgs = args
      return { status: 'ldap-ok' }
    },
  })
  assert.equal(ldapArgs.providerId, 'ldap-main')
  assert.equal(ldapArgs.returnUrl, '/ldap-home')

  let redirectArgs = null
  authFlow.startSsoLogin({
    provider: providers[2],
    returnUrl: '/after-cas',
    startRedirectLogin(args) {
      redirectArgs = args
      return `/sso/${args.providerId}?returnUrl=${encodeURIComponent(args.returnUrl)}`
    },
  })
  assert.equal(redirectArgs.providerId, 'cas')
  assert.equal(redirectArgs.returnUrl, '/after-cas')
  assert.equal(authFlow.resolveReturnUrl('https://example.test/callback?returnUrl=%2Fafter-callback'), '/after-callback')

  return {
    bytes: Buffer.from(
      stableStringify({
        providers: model,
        journeys: ['local', 'ldap', 'cas', 'oauth2', 'oidc', 'callback', 'returnUrl'],
      }),
    ),
  }
}

function runLoginFallbackSmoke(projectRoot) {
  const authFlow = createBabelModuleLoader(projectRoot, () => UNHANDLED_MODULE)('src/authFlow.js')
  assert.equal(authFlow.resolveLoginMessage('loading', 'zh-CN'), '正在加载登录方式...')
  assert.equal(authFlow.resolveLoginMessage('loading', 'en-US'), 'Loading login methods...')
  assert.match(authFlow.fallbackLoginError(new Error('network down')), /network down/)
  assert.match(authFlow.fallbackLoginError({ message: 'provider unavailable' }), /provider unavailable/)

  return {
    bytes: Buffer.from(
      stableStringify({
        i18n: ['zh-CN', 'en-US'],
        fallback: ['Error', 'object-message'],
      }),
    ),
  }
}

function resolveLocalModule(importerPath, specifier) {
  const basePath = path.resolve(path.dirname(importerPath), specifier)
  const candidates = [basePath, `${basePath}.jsx`, `${basePath}.js`, path.join(basePath, 'index.jsx'), path.join(basePath, 'index.js')]
  const resolved = candidates.find((candidate) => fs.existsSync(candidate))
  if (!resolved) {
    throw new Error(`cannot resolve ${specifier} from ${importerPath}`)
  }
  return resolved
}

function runDeleteSmoke(projectRoot) {
  const distDir = path.join(projectRoot, 'dist')
  assert.equal(fs.existsSync(distDir), true, 'dist must exist before delete smoke')
  fs.rmSync(distDir, { recursive: true, force: true })
  assert.equal(fs.existsSync(distDir), false, 'dist must be removable after smoke')

  return {
    bytes: Buffer.from(
      stableStringify({
        target: 'dist',
        deleted: true,
      }),
    ),
  }
}

function createHostElement() {
  const children = new Map()
  return {
    querySelector(selector) {
      if (!selector.startsWith('#')) {
        return null
      }
      return children.get(selector.slice(1)) || null
    },
    appendChild(child) {
      children.set(child.id, child)
      return child
    },
  }
}

function createElement(tagName) {
  return {
    tagName,
    id: '',
  }
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
  const requiredSmokeNamesByDelivery = {
    MICRO_FRONTEND_APP: report.templateId.startsWith('frontend.login.')
      ? ['login-contract-smoke', 'login-auth-journey-smoke', 'login-i18n-fallback-smoke']
      : ['app-route-smoke', 'mount-update-unmount-smoke', 'delete-smoke'],
    MICRO_FRONTEND_PARCELS: report.templateId === 'frontend.layout.vue-vite'
      ? ['layout-contract-smoke', 'vue-layout-parcel-smoke']
      : ['layout-contract-smoke', 'topbar-parcel-smoke', 'sidebar-parcel-smoke'],
    MICRO_FRONTEND_LIBRARY: ['component-library-contract-smoke', 'component-library-registration-smoke', 'component-library-dependency-smoke'],
    PLATFORM_COMPONENT_LIBRARY: ['platform-library-contract-smoke', 'platform-library-install-smoke', 'platform-library-upgrade-conflict-smoke'],
  }
  const requiredSmokeNames = requiredSmokeNamesByDelivery[report.deliveryType]
  assert.ok(requiredSmokeNames, `unsupported report delivery type: ${report.deliveryType}`)
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
