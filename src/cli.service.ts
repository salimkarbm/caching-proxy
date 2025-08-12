import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CliService {
  private readonly logger = new Logger(CliService.name);
  private args: string[];

  setArgs(args: string[]) {
    this.args = args;
    //this.logger.debug(`CLI arguments: ${args.join(' ')}`);
  }

  getArg(name: string): string | undefined {
    const prefix = `--${name}=`;
    const arg = this.args.find((a) => a.startsWith(prefix));
    const value = arg ? arg.slice(prefix.length) : undefined;
    if (!value) {
      this.logger.warn(`Missing argument: ${name}`);
    }
    return value;
  }

  hasFlag(name: string): boolean {
    return (
      this.args.includes(`--${name}`) ||
      this.args.includes(`-${name.charAt(0)}`)
    );
  }

  getPositional(index: number): string | undefined {
    // Filter out flags (starting with - or --)
    const positionalArgs = this.args.filter((arg) => !arg.startsWith('-'));
    return positionalArgs[index];
  }
}
