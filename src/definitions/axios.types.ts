import { type AxiosError } from 'axios'
export interface ErrorResponse extends AxiosError {
  code: number
  message: string
}
