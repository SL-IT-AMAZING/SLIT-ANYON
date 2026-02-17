import { getGithubUser } from "../handlers/github_handlers";

export async function getGitAuthor() {
  const user = await getGithubUser();
  const author = user
    ? {
        name: `[anyon]`,
        email: user.email,
      }
    : {
        name: "[anyon]",
        email: "git@any-on.dev",
      };
  return author;
}
