export interface SlackPresenter {
  postMessage(channel: string, message: string): void;
}
