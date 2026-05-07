import { type AccountAssociation } from '@farcaster/miniapp-core/src/manifest';

/**
 * Application constants and configuration values.
 */

// --- App Configuration ---
export const APP_URL: string = process.env.NEXT_PUBLIC_URL!;
export const APP_NAME: string = 'CastRewards';
export const APP_DESCRIPTION: string = 'Daily check-in, missions & spin wheel to earn crypto rewards';
export const APP_PRIMARY_CATEGORY: string = 'finance';
export const APP_TAGS: string[] = ['rewards', 'crypto', 'checkin', 'spin'];

// --- Asset URLs ---
export const APP_ICON_URL: string = `${APP_URL}/icon.png`;
export const APP_OG_IMAGE_URL: string = `${APP_URL}/api/opengraph-image`;
export const APP_SPLASH_URL: string = `${APP_URL}/splash.png`;
export const APP_SPLASH_BACKGROUND_COLOR: string = '#3C3489';

// --- Account Association ---
export const APP_ACCOUNT_ASSOCIATION: AccountAssociation | undefined = {
  header: "eyJmaWQiOjI2MTYwMCwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDVkN2Q3ZEVkRjllNEYzY0FmNTc3MTg3OTA2NDYxNTI2MTZDYzgyZWUifQ",
  payload: "eyJkb21haW4iOiJjYXN0cmV3YXJkcy1hcHAudmVyY2VsLmFwcCJ9",
  signature: "HY32FQzJd+6+t/iV22GfKo43pBX9Um0fEoCiU4ojoR1GBv+xjTbDWn5Iwsj1nRY3Op56a+bcxJCL0+0cAOzF9xs=",
};

// --- UI Configuration ---
export const APP_BUTTON_TEXT: string = 'Launch CastRewards';

// --- Integration Configuration ---
export const APP_WEBHOOK_URL: string =
  process.env.NEYNAR_API_KEY && process.env.NEYNAR_CLIENT_ID
    ? `https://api.neynar.com/f/app/${process.env.NEYNAR_CLIENT_ID}/event`
    : `${APP_URL}/api/webhook`;

export const USE_WALLET: boolean = true;
export const ANALYTICS_ENABLED: boolean = true;
export const APP_REQUIRED_CHAINS: string[] = [];
export const RETURN_URL: string | undefined = undefined;

// PLEASE DO NOT UPDATE THIS
export const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
  name: 'Farcaster SignedKeyRequestValidator',
  version: '1',
  chainId: 10,
  verifyingContract:
    '0x00000000fc700472606ed4fa22623acf62c60553' as `0x${string}`,
};

// PLEASE DO NOT UPDATE THIS
export const SIGNED_KEY_REQUEST_TYPE = [
  { name: 'requestFid', type: 'uint256' },
  { name: 'key', type: 'bytes' },
  { name: 'deadline', type: 'uint256' },
];