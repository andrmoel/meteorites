import type { Config } from 'jest';

const config: Config = {
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
        '^.+\\.tsx?$': ['@swc/jest', {
            jsc: {
                parser: {
                    syntax: 'typescript',
                },
                target: 'es2022',
            },
            module: {
                type: 'commonjs',
            },
        }],
    },
};

export default config;
