interface weatherDto {
  description: string
}
interface mainDto {
  temp: number
  feels_like: number
  pressure: number
}
interface windDto {
  speed: number
}
interface cloudDto {
  all: number
}
export class getWeatherDto {
  weather: weatherDto[]
  main: mainDto
  visibility: number
  wind: windDto
  clouds: cloudDto
}