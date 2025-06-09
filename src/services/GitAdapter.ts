export interface GitAdapter {
  pushToRepo(params: {
    repoName: string;
    branch: string;
    content: string;
    token: string;
  }): Promise<void>;

  fetchUserRepos(params: { accessToken: string }): Promise<unknown[]>;
}
