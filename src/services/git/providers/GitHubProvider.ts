import {type GitAdapter, type GitAdapterFetchRepoContent, type GitAdapterMethodInterface} from "./../GitAdapter";
import { Octokit } from "octokit";

export class GitHubProvider implements GitAdapter {
  static async fetchUserRepos({ accessToken }: GitAdapterMethodInterface) {
    const octokit = new Octokit({ auth: accessToken })

    return (await octokit.rest.repos.listForAuthenticatedUser())?.data
  }

  static async fetchRepoContent({accessToken, username, repository, branch}: GitAdapterFetchRepoContent) {
    const octokit = new Octokit({ auth: accessToken })

    return (await octokit.rest.git.getTree({
      owner: username,
      repo: repository,
      tree_sha: branch,
      recursive: 'true',
    }))?.data
  }

  static async pushToRepo({
    repoName,
    branch,
    content,
    token,
  }: {
    repoName: string;
    branch: string;
    content: string;
    token: string;
  }) {
    console.log("Pushing to repo", repoName, branch, content, token);
  }
}
