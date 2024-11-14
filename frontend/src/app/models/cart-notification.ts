export interface CartNotification {
  id?: number;
  userId: string;
  message: string;
  postId: string;
  read?: boolean; // Nova propriedade para indicar se a notificação foi lida
}
