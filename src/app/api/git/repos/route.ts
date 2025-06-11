import { auth } from "@/server/auth";
import {getGitAdapter} from "@/services/GitAdapterFactory";

export async function GET() {
  const session = await auth()

  if (!session) {
    const statusCode = 401
    return Response.json({
      code: statusCode,
      message: 'Unauthorized, please sign in.'
    }, {
      status: statusCode
    })
  }

  const provider = session.user.authorizedProvider
  console.log(provider)

  const gitAdapter = getGitAdapter(provider)

  const userRepos = await gitAdapter.fetchUserRepos({
    accessToken: session?.user?.accessToken ?? "",
  });

  return Response.json({ code: 200, repositories: userRepos })
}
