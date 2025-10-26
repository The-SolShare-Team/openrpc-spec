export async function getGithubFolderContents() {
  const apiUrl = `https://api.github.com/repos/solana-foundation/solana-com/contents/apps/web/content/docs/en/rpc/http?ref=main`;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }
  return await response.json();
}
