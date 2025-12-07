export interface SlackPresenter {
  postMessage(channel: string, message: string): void;
  postDMWithButton(
    userId: string,
    text: string,
    targetChannelId: string,
    targetMessageTs: string
  ): void;
}
