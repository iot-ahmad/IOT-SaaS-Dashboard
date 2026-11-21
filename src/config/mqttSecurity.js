/**
 * Shared MQTT Security Configuration & ESP32 TLS Helpers
 * - Zero hardcoded passwords or private cluster hostnames.
 * - Dual-CA TLS support: DigiCert Global Root G2 (EMQX Cloud) + ISRG Root X1 (HiveMQ Cloud).
 */

export const ISRG_ROOT_X1_PEM = `-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAwTzELMAkGA1UE
BhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2VhcmNoIEdyb3VwMRUwEwYDVQQD
EwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQG
EwJVUzEpMCcGA1UEChMgSW50ZXJuZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMT
DElTUkcgUm9vdCBYMTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54r
Vygch77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+0TM8ukj1
3Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6UA5/TR5d8mUgjU+g4rk8K
b4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sWT8KOEUt+zwvo/7V3LvSye0rgTBIlDHCN
Aymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyHB5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ
4Q7e2RCOFvu396j3x+UCB5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf
1b0SHzUvKBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWnOlFu
hjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTnjh8BCNAw1FtxNrQH
usEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbwqHyGO0aoSCqI3Haadr8faqU9GY/r
OPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CIrU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4G
A1UdDwEB/wQEAwIBBjAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY
9umbbjANBgkqhkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ3BebYhtF8GaV
0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KKNFtY2PwByVS5uCbMiogziUwt
hDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJw
TdwJx4nLCgdNbOhdjsnvzqvHu7UrTkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nx
e5AW0wdeRlN8NwdCjNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZA
JzVcoyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq4RgqsahD
YVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPAmRGunUHBcnWEvgJBQl9n
JEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57demyPxgcYxn/eR44/KJ4EBs+lVDR3veyJ
m+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----`;

export const DIGICERT_GLOBAL_ROOT_G2_PEM = `-----BEGIN CERTIFICATE-----
MIIDjjCCAnagAwIBAgIQAzrx5qcRqaC7KGSxHQn65TANBgkqhkiG9w0BAQsFADBhMQswCQYDVQQG
EwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3d3cuZGlnaWNlcnQuY29tMSAw
HgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBHMjAeFw0xMzA4MDExMjAwMDBaFw0zODAxMTUx
MjAwMDBaMGExCzAJBgNVBAYTAlVTMRUwEwYDVQQKEwxEaWdpQ2VydCBJbmMxGTAXBgNVBAsTEHd3
dy5kaWdpY2VydC5jb20xIDAeBgNVBAMTF0RpZ2lDZXJ0IEdsb2JhbCBSb290IEcyMIIBIjANBgkq
hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuzfNNNx7a8myaJCtSnX/RrohCgiN9RlUyfuI2/Ou8jqJ
kTx65qsGGmvPrC3oXgkkRLpimn7Wo6h+4FR1IAWsULecYxpsMNzaHxmx1x7e/dfgy5SDN67sH0NO
3Xss0r0upS/kqbitOtSZpLYl6ZtrAGCSYP9PIUkY92eQq2EGnI/yuum06ZIya7XzV+hdG82MHauV
BJVJ8zUtluNJbd134/tJS7SsVQepj5WztCO7TG1F8PapspUwtP1MVYwnSlcUfIKdzXOS0xZKBgyM
UNGPHgm+F6HmIcr9g+UQvIOlCsRnKPZzFBQ9RnbDhxSJITRNrw9FDKZJobq7nMWxM4MphQIDAQAB
o0IwQDAPBgNVHRMBAf8EBTADAQH/MA4GA1UdDwEB/wQEAwIBhjAdBgNVHQ4EFgQUTiJUIBiV5uNu
5g/6+rkS7QYXjzkwDQYJKoZIhvcNAQELBQADggEBAGBnKJRvDkhj6zHd6mcY1Yl9PMWLSn/pvtsr
F9+wX3N3KjITOYFnQoQj8kVnNeyIv/iPsGEMNKSuIEyExtv4NeF22d+mQrvHRAiGfzZ0JFrabA0U
WTW98kndth/Jsw1HKj2ZL7tcu7XUIOGZX1NGFdtom/DzMNU+MeKNhJ7jitralj41E6Vf8PlwUHBH
QRFXGU7Aj64GxJUTFy8bJZ918rGOmaFvE7FBcf6IKshPECBV1/MUReXgRPTqh5Uykw7+U0b6LJ3/
iyK5S9kJRaTepLiaWN0bfVKfjllDiIGknibVb63dDcY3fe0Dkhvld1927jyNxF1WW6LZZm6zNTfl
MrY=
-----END CERTIFICATE-----`;

/**
 * Extracts a clean hostname from a broker URL (wss://, mqtts://, or bare host:port).
 */
export function parseBrokerHost(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return 'YOUR_MQTT_BROKER_HOST';
  try {
    if (/^[a-z]+:\/\//i.test(trimmed)) {
      return new URL(trimmed).hostname || 'YOUR_MQTT_BROKER_HOST';
    }
    const host = trimmed.split('/')[0].split(':')[0].trim();
    return host || 'YOUR_MQTT_BROKER_HOST';
  } catch {
    return 'YOUR_MQTT_BROKER_HOST';
  }
}

/**
 * Returns the appropriate Root CA certificate metadata & PEM for the given broker host.
 */
export function getRootCaForHost(host) {
  const lower = String(host || '').toLowerCase();
  if (lower.includes('emqxsl.com') || lower.includes('emqx.io') || lower.includes('emqxcloud.com')) {
    return {
      name: 'DigiCert Global Root G2',
      wsPort: 8084,
      pem: DIGICERT_GLOBAL_ROOT_G2_PEM,
    };
  }
  if (lower.includes('hivemq.cloud')) {
    return {
      name: 'ISRG Root X1',
      wsPort: 8884,
      pem: ISRG_ROOT_X1_PEM,
    };
  }
  return {
    name: 'DigiCert Global Root G2 + ISRG Root X1',
    wsPort: 8084,
    pem: `${DIGICERT_GLOBAL_ROOT_G2_PEM}\n${ISRG_ROOT_X1_PEM}`,
  };
}

/**
 * Returns the configured broker hostname from Vite environment variables,
 * or a safe placeholder when none is configured.
 */
export function getDefaultBrokerHost() {
  return parseBrokerHost(import.meta.env.VITE_MQTT_BROKER_URL || '');
}

/**
 * Builds C++ TLS Root CA, NTP time-sync helper, and hardware-unique Client ID helper for ESP32.
 * Note: R"EOF( begins immediately with -----BEGIN CERTIFICATE----- (no leading newline)
 * and ends with a newline before )EOF" so mbedTLS parses the PEM cleanly.
 */
export function buildEsp32TlsHelpers(host) {
  const ca = getRootCaForHost(host);
  return `// ${ca.name} CA Certificate (Required for verified TLS)
static const char* root_ca = R"EOF(${ca.pem}
)EOF";

// Sync device clock via NTP so WiFiClientSecure can validate TLS certificate expiry
void syncTimeForTLS() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("Syncing NTP time for TLS");
  int tries = 0;
  while (time(nullptr) < 1700000000 && tries < 25) {
    delay(300);
    Serial.print(".");
    tries++;
  }
  Serial.println(" done!");
}

// Generate collision-free unique Client ID from ESP32 eFuse MAC + random hex
String makeUniqueClientId(const char* prefix) {
  uint64_t mac = ESP.getEfuseMac();
  return String(prefix) + "_" + String((uint32_t)(mac >> 24), HEX) + "_" + String(random(0xFFFF), HEX);
}`;
}

export const ESP32_TLS_HELPERS = buildEsp32TlsHelpers(getDefaultBrokerHost());

/**
 * Resolves MQTT broker options for generated ESP32 sketches.
 * Never embeds shared demo credentials; only embeds credentials when explicitly opted in for private mode.
 */
export function resolveSketchMqttOptions(mqttOptions = {}) {
  const includeCreds = Boolean(mqttOptions.includeCredentials);
  const host = mqttOptions.host || getDefaultBrokerHost();
  const ca = getRootCaForHost(host);
  return {
    host,
    port: Number(mqttOptions.tlsPort) || 8883,
    user: (includeCreds && mqttOptions.username) ? mqttOptions.username : 'YOUR_MQTT_USERNAME',
    pass: (includeCreds && mqttOptions.password) ? mqttOptions.password : 'YOUR_MQTT_PASSWORD',
    caName: ca.name,
    tlsHelpers: buildEsp32TlsHelpers(host),
  };
}
