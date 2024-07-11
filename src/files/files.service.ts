import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as NodeCache from 'node-cache';

@Injectable()
export class FilesService {
  private cache: NodeCache;
  private externalEndpoint = 'https://rest-test-eight.vercel.app/api/test';
  private readonly logger = new Logger(FilesService.name);

  constructor() {
    this.cache = new NodeCache({ stdTTL: 600 }); // Cache data for 10 minutes
  }

  async fetchData(): Promise<string[]> {
    try {
      const response = await axios.get(this.externalEndpoint);
      const data = response.data.items;

      if (!Array.isArray(data)) throw new Error('Expected data to be an array of URLs')
  
      return data;

    } catch (error) {
      this.logger.error('Error fetching data:', error);
      throw error;
    }
  }

  transformData(data): Record<string, any> {
    const result: Record<string, any> = {};
    data.forEach((url) => {
      const urlObj = new URL(url.fileUrl);
      const ipAddress = urlObj.hostname;
      const pathSegments = urlObj.pathname.split('/').filter((segment) => segment);

      if (!result[ipAddress]) {
        result[ipAddress] = [];
      }

      let currentLevel = result[ipAddress];

      pathSegments.forEach((segment, index) => {
        if (index === pathSegments.length - 1) {
          currentLevel.push(segment);
        } else {
          let existingDirectory = currentLevel.find((item: any) => typeof item === 'object' && item[segment]);

          if (!existingDirectory) {
            existingDirectory = { [segment]: [] };
            currentLevel.push(existingDirectory);
          }

          currentLevel = existingDirectory[segment];
        }
      });
    });

    return result;
  }

  async getTransformedData(): Promise<Record<string, any>> {
    const cacheKey = 'transformedData';

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const data = await this.fetchData();
      const transformedData = this.transformData(data);
      this.cache.set(cacheKey, transformedData);
      return transformedData;
    } catch (error) {
      this.logger.error('Error transforming data:', error);
      throw error;
    }
  }
}
