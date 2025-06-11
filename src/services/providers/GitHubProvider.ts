// lib/gitAdapters/GitHubProvider.ts
import { type GitAdapter } from "./../GitAdapter";
import { Octokit } from "octokit";

export class GitHubProvider implements GitAdapter {
  static async fetchUserRepos({ accessToken }: { accessToken: string }) {
    console.log("Fetching user repos");
    const octokit = new Octokit({ auth: accessToken });

    return (await octokit.rest.repos.listForAuthenticatedUser())?.data;
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
