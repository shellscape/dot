import type { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { MonitoringFacade, SnsAlarmActionStrategy } from 'cdk-monitoring-constructs';

import type { DotStack } from '../constructs/Stack.js';

import { addTopic } from './sns.js';

interface AddMonitoringOptions {
  emailAddress: string;
  fargateService: ApplicationLoadBalancedFargateService;
  scope: DotStack;
}

export const addFargateMonitoring = (options: AddMonitoringOptions) => {
  const { emailAddress, fargateService, scope } = options;

  const { topic: onAlarmTopic } = addTopic({ emailAddress, name: 'alarm', scope });

  const monitoring = new MonitoringFacade(scope, scope.resourceName('monitor'), {
    alarmFactoryDefaults: {
      action: new SnsAlarmActionStrategy({ onAlarmTopic }),
      actionsEnabled: true,
      alarmNamePrefix: scope.resourceName('alarm')
    }
  });

  monitoring.monitorFargateService({
    addCpuUsageAlarm: {
      Warning: {
        maxUsagePercent: 80
      }
    },
    addHealthyTaskPercentAlarm: {
      Warning: {
        minHealthyTaskPercent: 75
      }
    },
    addMemoryUsageAlarm: {
      Warning: {
        maxUsagePercent: 80
      }
    },
    addToAlarmDashboard: true,
    addToDetailDashboard: true,
    addToSummaryDashboard: true,
    fargateService
  });
};
