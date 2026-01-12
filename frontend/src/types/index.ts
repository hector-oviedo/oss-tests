export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}


export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}
