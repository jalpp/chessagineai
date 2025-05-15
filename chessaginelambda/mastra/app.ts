import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { chessAgine } from './mastra/agents';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (!event.body) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'body is required!',
            }),
        };
    }

    const body = JSON.parse(event.body);

    const { query } = body;

    const response = await chessAgine.generate([{ role: 'user', content: query }]);

    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST',
        },
        body: JSON.stringify({
            message: response.text,
        }),
    };
};
