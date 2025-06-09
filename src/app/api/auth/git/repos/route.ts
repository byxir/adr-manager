import { auth } from "@/server/auth";
import { GitHubAdapter } from "@/services/GitHubAdapter";

export async function GET() {
  const session = await auth();

  console.log(session);

  const gitHubAdapter = new GitHubAdapter();

  const userRepos = await gitHubAdapter.fetchUserRepos({
    accessToken: session?.user?.accessToken ?? "",
  });

  return Response.json({ repositories: userRepos });
}
