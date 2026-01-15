export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
  reasoning?: string;
}

export type Mode = 'completion' | 'chat';

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  mode: Mode;
}