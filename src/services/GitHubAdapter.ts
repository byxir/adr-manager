// lib/gitAdapters/GitHubAdapter.ts
import { type GitAdapter } from "./GitAdapter";
import { Octokit } from "octokit";

export class GitHubAdapter implements GitAdapter {
  async fetchUserRepos({ accessToken }: { accessToken: string }) {
    console.log("Fetching user repos");
    const octokit = new Octokit({ auth: accessToken });

    return (await octokit.rest.repos.listForAuthenticatedUser())?.data;
  }

  async pushToRepo({
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
