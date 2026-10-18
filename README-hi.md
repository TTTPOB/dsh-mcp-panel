# dsh-mcp-panel

यह [PerryLink/dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) का TTTPOB द्वारा संचालित निजी fork है, जो 0.6.24 पर आधारित है। Settings → Plugins → MCP में आधिकारिक MCP क्लाइंट प्रबंधित करें।

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

## उपयोग

Reconnect केवल चुने गए सक्षम MCP प्लगइन को Cordis Fiber.restart() से पुनः शुरू करता है। पुराना कनेक्शन बंद होता है और पुनः प्रयास बजट रीसेट होता है; कॉन्फ़िगरेशन नहीं बदलता। पुष्टि का अर्थ प्लगइन का पुनः आरंभ है, सफल सर्वर कनेक्शन नहीं। अक्षम प्रविष्टि को अलग से सक्षम करें।

Refresh स्थिति का स्नैपशॉट पढ़ता है। Probe सक्रिय प्लगइन की मूल्यांकित कॉन्फ़िगरेशन, गतिशील headers और environment के साथ अलग HTTP या stdio handshake करता है। ये क्रियाएँ पुराने क्लाइंट को दोबारा नहीं जोड़तीं। Refresh विफल होने पर पिछला स्नैपशॉट बना रहता है; अज्ञात स्थिति अज्ञात रहती है।

```text
/mcp
/mcp <server> tools
/mcp <server> health
/mcp <server> call <tool> [json]
```

## Configuration

| कुंजी | डिफ़ॉल्ट | अर्थ |
|---|---|---|
| `probeEnabled` | `true` | `mcp_probe` पृष्ठभूमि-कार्य टूल पंजीकृत करें (परिणाम केवल पैनल) |
| `probeTimeoutMs` | `10000` | प्रति-प्रोब timeout (ms) |
| `maxProbes` | `10` | पैनल में दिखाए गए प्रोब रिकॉर्ड |
| `refreshIntervalMs` | `0` | सुझाया गया पैनल रीफ़्रेश (ms); `0` = माँग पर |
| `outputLanguage` | `en` | `/mcp` आउटपुट भाषा: `en \| zh \| es \| pt \| hi` |
| `passiveProbeEnabled` | `false` | streamable-http सर्वरों की आवधिक जाँच |
| `passiveProbeIntervalMs` | `60000` | निष्क्रिय प्रोब अंतराल (ms) |
| `trialEnabled` | `true` | टूल ट्रायल कंसोल (सेटिंग्स टैब + `/mcp call`) |
| `trialTimeoutMs` | `120000` | प्रति ट्रायल कॉल पैनल-साइड समय सीमा (ms) |
| `trialMaxResultChars` | `60000` | ट्रायल परिणाम payload की सीमा (वर्ण) |
| `writeEnabled` | `true` | कठोर स्विच: `false` हर प्रोफ़ाइल लेखन अस्वीकार करता है (कॉपी फिर भी चलती है) |
| `writeVerifyEnabled` | `true` | सफलता बताने से पहले हर लेखन को loader के पुनः-लागू अवस्था के विरुद्ध सत्यापित करता है |
| `writeVerifyTimeoutMs` | `3000` | लेखन सत्यापन के लिए पोलिंग बजट (मि.से.) |
| `backupCount` | `5` | प्रति लेखन रखे गए `cordis.patch.yml` बैकअप |
| `catalogEntries` | `[]` | अनुशंसित निर्देशिका के लिए उपयोगकर्ता ओवरले: प्रविष्टियाँ जोड़ता है; समान `id` वाली प्रविष्टि अंतर्निहित को बदल देती है |

## विकास

```sh
pnpm install --frozen-lockfile
pnpm run typecheck:ci
pnpm test
pnpm run lint
pnpm run check:readmes
pnpm run build
pnpm run verify:self-contained
pnpm run verify:artifacts
pnpm pack
```

## रिलीज़

[ADR](docs/adr/) · [GitHub Releases](https://github.com/TTTPOB/dsh-mcp-panel/releases) · [Apache-2.0](LICENSE)

```sh
gh release download v0.6.24-fork1 --repo TTTPOB/dsh-mcp-panel --pattern "*.tgz"
dsh plugin --profile web add ./dsh-mcp-panel-0.6.24-fork1.tgz
```
