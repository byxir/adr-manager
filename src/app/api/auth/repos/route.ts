import { GitHubAdapter } from "@/services/GitHubAdapter";
import { auth } from "@/server/auth";

export async function GET() {
  const session = await auth();

  console.log(session);

  const gitHubAdapter = new GitHubAdapter();

  const userRepos = await gitHubAdapter.fetchUserRepos({
    accessToken: session?.user?.accessToken ?? "",
  });

  return Response.json({ repositories: userRepos });
}
