/**
 * /scripts/netlify-trigger-build.ts
 *
 * Minimal TypeScript utility to trigger a production build on Netlify
 * using POST /api/v1/sites/:SITE_ID/builds and poll the resulting deploy
 * until its state is "ready" or "error".
 *
 * Usage (example):
 *   NETLIFY_AUTH_TOKEN=... SITE_ID=... node --loader ts-node/esm scripts/netlify-trigger-build.ts
 *
 * Environment:
 *   - NETLIFY_AUTH_TOKEN
 *   - SITE_ID
 *
 * Notes:
 *   - Uses global `fetch` available in Node.js 20 (or Next.js runtime).
 *   - No external dependencies.
 */

type BuildCreateResponse = {
  id: string;
  state?: string;
  deploy_id?: string;
  [k: string]: unknown;
};

type BuildInspectResponse = BuildCreateResponse;

type DeployResponse = {
  id: string;
  state: string; // e.g. "building", "ready", "error"
  [k: string]: unknown;
};

export async function triggerNetlifyBuild(opts?: {
  pollIntervalMs?: number;
  timeoutMs?: number;
}): Promise<{ build_id: string; deploy_id: string; finalState: string }> {
  const NETLIFY_AUTH_TOKEN = process.env.NETLIFY_AUTH_TOKEN;
  const SITE_ID = process.env.SITE_ID;

  if (!NETLIFY_AUTH_TOKEN) throw new Error('NETLIFY_AUTH_TOKEN is not set in process.env');
  if (!SITE_ID) throw new Error('SITE_ID is not set in process.env');

  const pollIntervalMs = opts?.pollIntervalMs ?? 3000;
  const timeoutMs = opts?.timeoutMs ?? 10 * 60 * 1000; // default 10 minutes

  const baseUrl = 'https://api.netlify.com/api/v1';
  const buildsUrl = `${baseUrl}/sites/${encodeURIComponent(SITE_ID)}/builds`;
  const headers = {
    Authorization: `Bearer ${NETLIFY_AUTH_TOKEN}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Create build
  const createRes = await fetch(buildsUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });

  if (createRes.status !== 201) {
    const body = await safeText(createRes);
    throw new Error(`Failed to create build: ${createRes.status} ${createRes.statusText} ${body}`);
  }

  const build: BuildCreateResponse = await createRes.json();
  const buildId = build.id;
  let deployId = (build.deploy_id as string | undefined) ?? undefined;

  // If deploy_id isn't present on create, inspect the build resource
  if (!deployId) {
    const inspectUrl = `${baseUrl}/sites/${encodeURIComponent(SITE_ID)}/builds/${encodeURIComponent(
      buildId,
    )}`;
    const inspectRes = await fetch(inspectUrl, { method: 'GET', headers });
    if (!inspectRes.ok) {
      const body = await safeText(inspectRes);
      throw new Error(`Failed to inspect build ${buildId}: ${inspectRes.status} ${inspectRes.statusText} ${body}`);
    }
    const inspected: BuildInspectResponse = await inspectRes.json();
    deployId = (inspected.deploy_id as string | undefined) ?? undefined;
  }

  if (!deployId) {
    throw new Error(`Could not determine deploy_id for build ${buildId}. Build payload: ${JSON.stringify(build)}`);
  }

  // Poll deploy status until ready or error
  const deployUrl = `${baseUrl}/deploys/${encodeURIComponent(deployId)}`;
  const start = Date.now();
  let lastState: string | null = null;

  while (true) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for deploy ${deployId} (timeout ${timeoutMs}ms)`);
    }

    const dRes = await fetch(deployUrl, { method: 'GET', headers });
    if (!dRes.ok) {
      const body = await safeText(dRes);
      throw new Error(`Failed to fetch deploy ${deployId}: ${dRes.status} ${dRes.statusText} ${body}`);
    }
    const deploy: DeployResponse = await dRes.json();
    const state = deploy.state;

    if (state !== lastState) {
      if (state === 'building') {
        console.log('building');
      } else if (state === 'ready') {
        console.log('ready');
      } else if (state === 'error') {
        console.log('error');
      } else {
        console.log(state);
      }
      lastState = state;
    }

    if (state === 'ready' || state === 'error') {
      return { build_id: buildId, deploy_id: deployId, finalState: state };
    }

    await delay(pollIntervalMs);
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Default export for convenience
export default triggerNetlifyBuild;
