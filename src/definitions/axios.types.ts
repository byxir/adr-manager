import { type AxiosError } from 'axios'
export interface ErrorResponse extends AxiosError {
  message: string
}
