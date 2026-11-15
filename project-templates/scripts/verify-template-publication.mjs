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
const QUALIFICATION_DIR = path.join(TARGET_DIR, 'qualification')
const PUBLICATION_DIR = path.join(TARGET_DIR, 'publication')
const DIST_DIR = path.join(PROJECT_TEMPLATES_DIR, 'dist')
const DIST_CATALOG_DIR = path.join(DIST_DIR, 'catalog')
const DIST_ARTIFACT_DIR = path.join(DIST_DIR, 'artifacts')
const TRUSTED_TEMPLATE_HOST = 'templates.example.invalid'
const CATALOG_ISSUED_AT = new Date()
const CATALOG_EXPIRES_AT = new Date(CATALOG_ISSUED_AT.getTime() + 30 * 24 * 60 * 60 * 1000)

const TEMPLATE_ROWS = [
  ['frontend.micro-app.react-webpack', 'React 前端应用', false],
  ['frontend.micro-app.vue-vite', 'Vue 前端应用', false],
  ['frontend.layout.react-webpack', 'React 自定义布局', false],
  ['frontend.layout.vue-vite', 'Vue 自定义布局', false],
  ['frontend.component-library.react-webpack', 'React 组件库', false],
  ['frontend.component-library.vue-vite', 'Vue 组件库', false],
  ['frontend.login.react-webpack', 'React 自定义登录页', false],
  ['frontend.login.vue-vite', 'Vue 自定义登录页', false],
  ['frontend.platform-component-library.react-webpack', 'React 平台组件库', false],
  ['frontend.platform-component-library.vue-vite', 'Vue 平台组件库', false],
  ['backend.extension.spring-autoconfigure', '后端 Maven 扩展包', false],
].map(([templateId, displayName, previewOnly]) => ({ templateId, displayName, previewOnly }))

const TEMPLATE_DESCRIPTIONS = new Map([
  ['frontend.micro-app.react-webpack', '生成可挂载到平台的前端应用。'],
  ['frontend.micro-app.vue-vite', '生成可挂载到平台的前端应用。'],
  ['frontend.layout.react-webpack', '生成平台顶栏和侧栏布局。'],
  ['frontend.layout.vue-vite', '生成平台顶栏和侧栏布局。'],
  ['frontend.component-library.react-webpack', '生成可复用的微前端组件库。'],
  ['frontend.component-library.vue-vite', '生成可复用的微前端组件库。'],
  ['frontend.login.react-webpack', '生成接入平台认证的登录页。'],
  ['frontend.login.vue-vite', '生成接入平台认证的登录页。'],
  ['frontend.platform-component-library.react-webpack', '生成可上传到公共组件库的项目。'],
  ['frontend.platform-component-library.vue-vite', '生成可上传到公共组件库的项目。'],
  ['backend.extension.spring-autoconfigure', '生成后端自动配置扩展包。'],
])

function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.clean) {
    removeInsideTarget(PUBLICATION_DIR)
    removeInsideProjectTemplates(DIST_DIR)
  }
  fs.mkdirSync(PUBLICATION_DIR, { recursive: true })

  const qualifications = TEMPLATE_ROWS.map((row) => loadQualification(row))
  const previewCatalog = buildCatalog({
    sequence: 1,
    revision: 'cat_1_preview_fixture',
    rows: qualifications.map((qualification) => createReleaseFromQualification(qualification)),
  })
  const previewSignature = signPayload(Buffer.from(stableStringify(previewCatalog)))
  verifySignedCatalog(previewCatalog, previewSignature)
  const previewGate = verifyCatalogPublication(previewCatalog, previewSignature, qualifications)

  const stableQualifications = qualifications
    .filter((qualification) => !qualification.previewOnly)
    .map((qualification) => createStableQualificationFixture(qualification))
  const stableCatalog = buildCatalog({
    sequence: 2,
    revision: 'cat_2_stable_fixture',
    rows: stableQualifications.map((qualification) => createReleaseFromQualification(qualification)),
  })
  const stableSignature = signPayload(Buffer.from(stableStringify(stableCatalog)))
  verifySignedCatalog(stableCatalog, stableSignature)
  const stableGate = verifyCatalogPublication(stableCatalog, stableSignature, stableQualifications)

  const revokedCatalog = mutateCatalogStatus(stableCatalog, {
    sequence: 3,
    revision: 'cat_3_revoke_fixture',
    status: 'REVOKED',
  })
  const revokedSignature = signPayload(Buffer.from(stableStringify(revokedCatalog)))
  const revokedGate = verifyCatalogPublication(revokedCatalog, revokedSignature, stableQualifications, {
    allowRevoked: true,
  })

  const rollbackCatalog = buildCatalog({
    sequence: 4,
    revision: 'cat_4_rollback_fixture',
    rows: stableQualifications.map((qualification) => createReleaseFromQualification(qualification)),
  })
  const rollbackSignature = signPayload(Buffer.from(stableStringify(rollbackCatalog)))
  const rollbackGate = verifyCatalogPublication(rollbackCatalog, rollbackSignature, stableQualifications)

  const replayState = new ReplayState()
  const replayEvidence = [
    replayState.accept(previewCatalog),
    replayState.accept(stableCatalog),
    replayState.accept(revokedCatalog),
    replayState.accept(rollbackCatalog),
    expectReject('same-sequence-different-digest', () => replayState.accept({ ...rollbackCatalog, revision: 'cat_4_tampered' })),
    expectReject('lower-sequence-rollback', () => replayState.accept(stableCatalog)),
  ]

  const negativeEvidence = runNegativePublicationCases(qualifications, stableQualifications)
  const report = {
    status: 'passed',
    command: 'verify-template-publication',
    outputs: {
      publicationDir: PUBLICATION_DIR,
      report: path.join(PUBLICATION_DIR, 'publication-report.json'),
      previewCatalog: path.join(PUBLICATION_DIR, 'synthetic-preview-catalog.json'),
      stableCatalog: path.join(PUBLICATION_DIR, 'synthetic-stable-catalog.json'),
      revokedCatalog: path.join(PUBLICATION_DIR, 'synthetic-revoked-catalog.json'),
      rollbackCatalog: path.join(PUBLICATION_DIR, 'synthetic-rollback-catalog.json'),
      runtimeCatalog: path.join(DIST_CATALOG_DIR, 'stable-catalog.json'),
      runtimeArtifactsDir: DIST_ARTIFACT_DIR,
    },
    summary: {
      qualificationCount: qualifications.length,
      previewRows: previewGate.publishedRows,
      stableRows: stableGate.publishedRows,
      revokedRows: revokedGate.publishedRows,
      rollbackRows: rollbackGate.publishedRows,
      negativeCases: negativeEvidence.length,
      replayCases: replayEvidence.length,
    },
    evidence: {
      attestationVerify: qualifications.map((qualification) => ({
        templateId: qualification.templateId,
        descriptorSha256: qualification.descriptorSha256,
        attestationSha256: qualification.attestationSha256,
        verified: qualification.attestationVerified,
      })),
      previewGate,
      stableGate,
      revokedGate,
      rollbackGate,
      replayEvidence,
      negativeEvidence,
      isolatedStableFixture: {
        syntheticPlatformVersion: '2.0.0',
        writesRealCatalog: false,
        outputRoot: PUBLICATION_DIR,
      },
    },
  }

  assert.equal(report.summary.qualificationCount, 11)
  assert.equal(report.summary.previewRows, 11)
  assert.equal(report.summary.stableRows, 11)
  assert.equal(report.summary.revokedRows, 11)
  assert.equal(report.summary.rollbackRows, 11)
  assert.ok(report.summary.negativeCases >= 6)

  fs.writeFileSync(report.outputs.previewCatalog, JSON.stringify(previewCatalog, null, 2))
  fs.writeFileSync(report.outputs.stableCatalog, JSON.stringify(stableCatalog, null, 2))
  fs.writeFileSync(report.outputs.revokedCatalog, JSON.stringify(revokedCatalog, null, 2))
  fs.writeFileSync(report.outputs.rollbackCatalog, JSON.stringify(rollbackCatalog, null, 2))
  writeRuntimeStore(stableCatalog, stableQualifications)
  fs.writeFileSync(report.outputs.report, JSON.stringify(report, null, 2))

  process.stdout.write(JSON.stringify({ status: 'passed', summary: report.summary, report: report.outputs.report }, null, 2) + '\n')
}

function writeRuntimeStore(stableCatalog, stableQualifications) {
  removeInsideProjectTemplates(DIST_DIR)
  fs.mkdirSync(DIST_CATALOG_DIR, { recursive: true })
  fs.mkdirSync(DIST_ARTIFACT_DIR, { recursive: true })
  fs.writeFileSync(path.join(DIST_CATALOG_DIR, 'stable-catalog.json'), JSON.stringify(stableCatalog, null, 2))
  for (const qualification of stableQualifications) {
    const artifactDir = path.join(DIST_ARTIFACT_DIR, qualification.templateId)
    fs.mkdirSync(artifactDir, { recursive: true })
    fs.copyFileSync(
      path.join(qualification.root, 'template-artifact.zip'),
      path.join(artifactDir, 'template-artifact.zip'),
    )
  }
}

function parseArgs(args) {
  const options = { clean: false }
  for (const arg of args) {
    if (arg === '--clean') {
      options.clean = true
    } else {
      throw new Error(`unknown argument: ${arg}`)
    }
  }
  return options
}

function loadQualification(row) {
  const root = path.join(QUALIFICATION_DIR, row.templateId)
  const descriptorPath = path.join(root, 'qualification-descriptor.json')
  const attestationPath = path.join(root, 'qualification-attestation.json')
  const trustRootPath = path.join(root, 'qualification-trust-root.json')
  const artifactPath = path.join(root, 'template-artifact.zip')
  const reportPath = path.join(root, 'qualification-report.json')

  for (const filePath of [descriptorPath, attestationPath, trustRootPath, artifactPath, reportPath]) {
    assert.equal(fs.existsSync(filePath), true, `missing qualification output: ${filePath}`)
  }

  const descriptorBytes = fs.readFileSync(descriptorPath)
  assertCanonicalJsonBytes(descriptorBytes, descriptorPath)
  const descriptor = JSON.parse(descriptorBytes.toString('utf8'))
  const attestationBytes = fs.readFileSync(attestationPath)
  const attestation = JSON.parse(attestationBytes.toString('utf8'))
  const trustRoot = JSON.parse(fs.readFileSync(trustRootPath, 'utf8'))
  const artifactBytes = fs.readFileSync(artifactPath)
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
  const owner = loadTemplateOwner(row.templateId, descriptor.templateVersion)

  assert.equal(descriptor.templateId, row.templateId)
  assert.equal(owner.templateId, row.templateId)
  assert.equal(owner.templateVersion, descriptor.templateVersion)
  assert.equal(attestation.algorithm, 'Ed25519')
  assert.equal(attestation.keyId, trustRoot.keyId)
  assert.equal(attestation.descriptorSha256, sha256Hex(descriptorBytes))
  assert.equal(descriptor.artifact.sha256, sha256Hex(artifactBytes))
  assert.equal(descriptor.artifact.compressedSizeBytes, artifactBytes.length)
  assert.equal(report.status, 'passed')
  assert.ok(report.summary.testCount > 0, `${row.templateId} qualification report has zero tests`)

  const attestationVerified = crypto.verify(
    null,
    descriptorBytes,
    crypto.createPublicKey(trustRoot.publicKeyPem),
    Buffer.from(attestation.signature, 'base64'),
  )
  assert.equal(attestationVerified, true, `${row.templateId} attestation signature failed`)

  return {
    ...row,
    root,
    descriptor,
    descriptorBytes,
    descriptorSha256: sha256Hex(descriptorBytes),
    attestation,
    attestationBytes,
    attestationSha256: sha256Hex(attestationBytes),
    trustRoot,
    artifactBytes,
    report,
    parameterSchema: owner.parameterSchema,
    uiHints: normalizeOwnerUiHints(owner.uiHints),
    attestationVerified,
  }
}

function loadTemplateOwner(templateId, templateVersion) {
  const ownerPath = path.join(PROJECT_TEMPLATES_DIR, 'templates', templateId, templateVersion, 'owner.json')
  assert.equal(fs.existsSync(ownerPath), true, `missing template owner: ${ownerPath}`)
  return JSON.parse(fs.readFileSync(ownerPath, 'utf8'))
}

function normalizeOwnerUiHints(uiHints) {
  if (!uiHints) {
    return {}
  }
  if (!Array.isArray(uiHints)) {
    return uiHints
  }
  const normalized = {}
  for (const hint of uiHints) {
    assert.equal(typeof hint.parameter, 'string', 'uiHint.parameter must be text')
    const { parameter, ...body } = hint
    normalized[parameter] = body
  }
  return normalized
}

function createStableQualificationFixture(qualification) {
  const stableDescriptor = structuredClone(qualification.descriptor)
  stableDescriptor.channel = 'stable'
  stableDescriptor.qualificationProfileId = `${stableDescriptor.scope === 'BACKEND_EXTENSION' ? 'backend' : 'frontend'}-stable-v1`
  stableDescriptor.rowId = `${stableDescriptor.templateId}-${stableDescriptor.templateVersion}-platform-2.0.0-stable-fixture`
  stableDescriptor.compatibility = {
    ...stableDescriptor.compatibility,
    declaredPlatformRange: '[2.0.0,2.1.0)',
    testedPlatformVersions: ['2.0.0'],
  }
  const descriptorBytes = Buffer.from(stableStringify(stableDescriptor))
  const signature = signPayload(descriptorBytes)
  const attestation = {
    attestationVersion: '1',
    algorithm: 'Ed25519',
    keyId: signature.keyId,
    descriptorSha256: sha256Hex(descriptorBytes),
    signature: signature.signature,
  }
  const attestationBytes = Buffer.from(JSON.stringify(attestation, null, 2))

  return {
    ...qualification,
    descriptor: stableDescriptor,
    descriptorBytes,
    descriptorSha256: sha256Hex(descriptorBytes),
    attestation,
    attestationBytes,
    attestationSha256: sha256Hex(attestationBytes),
    trustRoot: signature.trustRoot,
    attestationVerified: true,
    syntheticStableFixture: true,
  }
}

function createReleaseFromQualification(qualification) {
  const descriptor = qualification.descriptor
  return {
    templateId: descriptor.templateId,
    templateVersion: descriptor.templateVersion,
    scope: descriptor.scope,
    displayName: qualification.displayName,
    description: TEMPLATE_DESCRIPTIONS.get(descriptor.templateId) ?? qualification.displayName,
    parameterSchema: qualification.parameterSchema,
    uiHints: qualification.uiHints,
    compatibilityRecords: [
      {
        rowId: descriptor.rowId,
        channel: descriptor.channel,
        status: 'ACTIVE',
        declaredPlatformRange: descriptor.compatibility.declaredPlatformRange,
        testedPlatformVersions: descriptor.compatibility.testedPlatformVersions,
        toolchain: descriptor.compatibility.toolchain,
        certificationEvidence: {
          qualificationProfileId: descriptor.qualificationProfileId,
          qualificationDescriptorSha256: qualification.descriptorSha256,
          attestationSha256: qualification.attestationSha256,
          attestationKeyId: qualification.attestation.keyId,
          ciRunId: `ci-${descriptor.templateId.replaceAll('.', '-')}`,
          certifiedAt: '2026-07-30T00:00:00Z',
        },
      },
    ],
    artifact: {
      uri: `https://${TRUSTED_TEMPLATE_HOST}/${descriptor.templateId}/${descriptor.templateVersion}/template.zip`,
      sha256: descriptor.artifact.sha256,
      compressedSizeBytes: descriptor.artifact.compressedSizeBytes,
      uncompressedSizeBytes: descriptor.artifact.uncompressedSizeBytes,
    },
    delivery: descriptor.delivery,
  }
}

function buildCatalog({ sequence, revision, rows }) {
  return {
    contractVersion: '1',
    revision,
    sequence,
    issuedAt: CATALOG_ISSUED_AT.toISOString(),
    expiresAt: CATALOG_EXPIRES_AT.toISOString(),
    templates: rows,
  }
}

function mutateCatalogStatus(catalog, { sequence, revision, status }) {
  const next = structuredClone(catalog)
  next.sequence = sequence
  next.revision = revision
  for (const release of next.templates) {
    for (const record of release.compatibilityRecords) {
      record.status = status
    }
  }
  return next
}

function verifyCatalogPublication(catalog, signature, qualifications, options = {}) {
  verifySignedCatalog(catalog, signature)
  const byTemplate = new Map(qualifications.map((qualification) => [qualification.templateId, qualification]))
  let publishedRows = 0
  for (const release of catalog.templates) {
    const qualification = byTemplate.get(release.templateId)
    assert.ok(qualification, `missing qualification for ${release.templateId}`)
    assert.equal(release.templateVersion, qualification.descriptor.templateVersion)
    assert.equal(release.scope, qualification.descriptor.scope)
    assert.equal(release.artifact.sha256, qualification.descriptor.artifact.sha256)
    assert.equal(release.artifact.compressedSizeBytes, qualification.descriptor.artifact.compressedSizeBytes)
    assert.equal(release.artifact.uncompressedSizeBytes, qualification.descriptor.artifact.uncompressedSizeBytes)
    assert.deepEqual(release.delivery, qualification.descriptor.delivery)
    assert.deepEqual(release.parameterSchema, qualification.parameterSchema)
    assert.deepEqual(release.uiHints, qualification.uiHints)
    assertTrustedArtifactUri(release.artifact.uri)

    for (const record of release.compatibilityRecords) {
      if (!options.allowRevoked) {
        assert.equal(record.status, 'ACTIVE')
      }
      assert.equal(record.rowId, qualification.descriptor.rowId)
      assert.equal(record.channel, qualification.descriptor.channel)
      assert.equal(record.declaredPlatformRange, qualification.descriptor.compatibility.declaredPlatformRange)
      assert.deepEqual(record.testedPlatformVersions, qualification.descriptor.compatibility.testedPlatformVersions)
      assert.deepEqual(record.toolchain, qualification.descriptor.compatibility.toolchain)
      assert.equal(record.certificationEvidence.qualificationProfileId, qualification.descriptor.qualificationProfileId)
      assert.equal(record.certificationEvidence.qualificationDescriptorSha256, qualification.descriptorSha256)
      assert.equal(record.certificationEvidence.attestationSha256, qualification.attestationSha256)
      assert.equal(record.certificationEvidence.attestationKeyId, qualification.attestation.keyId)
      assert.equal(qualification.attestationVerified, true)

      if (record.channel === 'stable') {
        assert.doesNotMatch(release.templateVersion, /-/)
        assert.ok(record.certificationEvidence.qualificationProfileId.endsWith('-stable-v1'))
        for (const platformVersion of record.testedPlatformVersions) {
          assert.doesNotMatch(platformVersion, /SNAPSHOT/)
        }
      }
      publishedRows += 1
    }
  }
  return {
    catalogDigest: sha256Hex(Buffer.from(stableStringify(catalog))),
    sequence: catalog.sequence,
    publishedRows,
  }
}

function runNegativePublicationCases(qualifications, stableQualifications) {
  const previewQualification = qualifications[0]
  const stableQualification = stableQualifications[0]
  const previewRelease = createReleaseFromQualification(previewQualification)
  const stableRelease = createReleaseFromQualification(stableQualification)
  const verifySigned = (catalog, selectedQualifications) => verifyCatalogPublication(
    catalog,
    signPayload(Buffer.from(stableStringify(catalog))),
    selectedQualifications,
  )
  const cases = [
    expectReject('unsafe-artifact-uri', () => {
      const catalog = buildCatalog({
        sequence: 10,
        revision: 'cat_10_unsafe_uri',
        rows: [{ ...previewRelease, artifact: { ...previewRelease.artifact, uri: 'http://169.254.169.254/template.zip' } }],
      })
      verifySigned(catalog, [previewQualification])
    }),
    expectReject('channel-profile-mismatch', () => {
      const catalog = buildCatalog({
        sequence: 11,
        revision: 'cat_11_channel_mismatch',
        rows: [{
          ...previewRelease,
          compatibilityRecords: [{ ...previewRelease.compatibilityRecords[0], channel: 'stable' }],
        }],
      })
      verifySigned(catalog, [previewQualification])
    }),
    expectReject('artifact-digest-mismatch', () => {
      const catalog = buildCatalog({
        sequence: 12,
        revision: 'cat_12_digest_mismatch',
        rows: [{ ...previewRelease, artifact: { ...previewRelease.artifact, sha256: '0'.repeat(64) } }],
      })
      verifySigned(catalog, [previewQualification])
    }),
    expectReject('snapshot-stable-promotion', () => {
      const badStable = structuredClone(stableQualification)
      badStable.descriptor.compatibility.testedPlatformVersions = ['2.0.0-rc.1-SNAPSHOT']
      const catalog = buildCatalog({
        sequence: 13,
        revision: 'cat_13_snapshot_stable',
        rows: [createReleaseFromQualification(badStable)],
      })
      verifySigned(catalog, [badStable])
    }),
    expectReject('attestation-digest-mismatch', () => {
      const catalog = buildCatalog({
        sequence: 14,
        revision: 'cat_14_attestation_mismatch',
        rows: [{
          ...stableRelease,
          compatibilityRecords: [{
            ...stableRelease.compatibilityRecords[0],
            certificationEvidence: {
              ...stableRelease.compatibilityRecords[0].certificationEvidence,
              attestationSha256: 'f'.repeat(64),
            },
          }],
        }],
      })
      verifySigned(catalog, [stableQualification])
    }),
    expectReject('catalog-signature-tamper', () => verifySignedCatalog(
      buildCatalog({ sequence: 15, revision: 'cat_15_tampered', rows: [stableRelease] }),
      signPayload(Buffer.from(stableStringify(buildCatalog({ sequence: 15, revision: 'cat_15_other', rows: [stableRelease] })))),
    )),
  ]
  return cases
}

function verifySignedCatalog(catalog, signature) {
  const catalogBytes = Buffer.from(stableStringify(catalog))
  assert.equal(signature.algorithm, 'Ed25519')
  assert.equal(signature.payloadSha256, sha256Hex(catalogBytes))
  const verified = crypto.verify(
    null,
    catalogBytes,
    crypto.createPublicKey(signature.trustRoot.publicKeyPem),
    Buffer.from(signature.signature, 'base64'),
  )
  assert.equal(verified, true, 'catalog signature failed')
}

function signPayload(payloadBytes) {
  const keyId = 'local-publication-ed25519'
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519')
  const trustRoot = {
    trustRootVersion: '1',
    algorithm: 'Ed25519',
    keyId,
    publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }),
  }
  return {
    signatureVersion: '1',
    algorithm: 'Ed25519',
    keyId,
    payloadSha256: sha256Hex(payloadBytes),
    signature: crypto.sign(null, payloadBytes, privateKey).toString('base64'),
    trustRoot,
  }
}

class ReplayState {
  #current = null

  accept(catalog) {
    const digest = sha256Hex(Buffer.from(stableStringify(catalog)))
    if (!this.#current) {
      this.#current = { sequence: catalog.sequence, digest }
      return { name: 'initial-sequence', sequence: catalog.sequence, digest, accepted: true }
    }
    if (catalog.sequence > this.#current.sequence) {
      this.#current = { sequence: catalog.sequence, digest }
      return { name: 'higher-sequence', sequence: catalog.sequence, digest, accepted: true }
    }
    if (catalog.sequence === this.#current.sequence && digest === this.#current.digest) {
      return { name: 'idempotent-replay', sequence: catalog.sequence, digest, accepted: true }
    }
    throw new Error(`catalog replay rejected: sequence=${catalog.sequence}`)
  }
}

function assertTrustedArtifactUri(uri) {
  const parsed = new URL(uri)
  assert.equal(parsed.protocol, 'https:', 'artifact URI must use HTTPS')
  assert.equal(parsed.hostname, TRUSTED_TEMPLATE_HOST, 'artifact URI host is not allowlisted')
  assert.doesNotMatch(parsed.pathname, /\.\.|\\|\/\//)
}

function assertCanonicalJsonBytes(bytes, label) {
  const parsed = JSON.parse(bytes.toString('utf8'))
  assert.equal(bytes.toString('utf8'), stableStringify(parsed), `${label} is not canonical JSON`)
}

function expectReject(name, action) {
  try {
    action()
  } catch (error) {
    return {
      name,
      rejected: true,
      reason: error instanceof Error ? error.message : String(error),
    }
  }
  throw new Error(`${name} was accepted unexpectedly`)
}

function removeInsideTarget(targetPath) {
  const resolved = path.resolve(targetPath)
  const targetRoot = path.resolve(TARGET_DIR)
  if (resolved !== targetRoot && !resolved.startsWith(`${targetRoot}${path.sep}`)) {
    throw new Error(`refusing to remove outside project-templates/target: ${resolved}`)
  }
  fs.rmSync(resolved, { recursive: true, force: true })
}

function removeInsideProjectTemplates(targetPath) {
  const resolved = path.resolve(targetPath)
  const projectTemplatesRoot = path.resolve(PROJECT_TEMPLATES_DIR)
  if (resolved === projectTemplatesRoot || !resolved.startsWith(`${projectTemplatesRoot}${path.sep}`)) {
    throw new Error(`refusing to remove outside project-templates: ${resolved}`)
  }
  fs.rmSync(resolved, { recursive: true, force: true })
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
