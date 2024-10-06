import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { GetCityDto } from './dto/get-city.dto';
import { getWeatherDto } from './dto/get-weather.dto';

@Injectable()
export class WeatherService {
  private capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  async getCoordsByCity(city: string) {
    try {
      const coords = await axios.get<GetCityDto[]>(process.env.CITY_URL + `?q=${city}&limit=1&appid=${process.env.APPID}`)
      return {
        lat: coords.data[0].lat,
        lon: coords.data[0].lon
      }
    } catch (e) {
      return 'К сожалению, мы не можем найти этот город. Проверьте грамотность написания и СЕЙЧАС напишите новый город'
    }
  }
  async getWeatherByCity(lat: number, lon: number) {
    try {
      const weather = await axios.get<getWeatherDto>(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=cad7ec124945dcfff04e457e76760d90&lang=ru`)
      return {
        description: this.capitalizeFirstLetter(weather.data.weather[0].description) as string,
        temp: Math.round(weather.data.main.temp - 273),
        feels_like: Math.round(weather.data.main.feels_like - 273),
        pressure: Math.round(weather.data.main.pressure * 0.75),
        speed: weather.data.wind.speed,
        cloudiness: weather.data.clouds.all
      }
    } catch (e) {
      console.log(e)
      return 'Не можем найти погоду в этой местности, попробуйте выбрать другую местность'
    }
  }
}
