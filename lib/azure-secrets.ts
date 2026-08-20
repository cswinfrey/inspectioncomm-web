import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

let client: SecretClient | undefined;

function getClient(): SecretClient {
  if (!client) {
    const vaultName = process.env.AZURE_KEY_VAULT_NAME;
    if (!vaultName) {
      throw new Error('AZURE_KEY_VAULT_NAME is not set');
    }
    client = new SecretClient(
      `https://${vaultName}.vault.azure.net`,
      new DefaultAzureCredential()
    );
  }
  return client;
}

const cache = new Map<string, Promise<string>>();

function getSecret(name: string): Promise<string> {
  let pending = cache.get(name);
  if (!pending) {
    pending = getClient()
      .getSecret(name)
      .then((secret) => {
        if (!secret.value) {
          throw new Error(`Key Vault secret "${name}" has no value`);
        }
        return secret.value;
      });
    cache.set(name, pending);
  }
  return pending;
}

export function getAzureStorageConnectionString(): Promise<string> {
  return getSecret('AZURE-STORAGE-CONNECTION-STRING');
}

export function getAzureStorageAccountKey(): Promise<string> {
  return getSecret('AZURE-STORAGE-ACCOUNT-KEY');
}
