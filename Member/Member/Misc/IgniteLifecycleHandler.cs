using Apache.Ignite.Core.Lifecycle;

namespace Member.Misc
{
    public class IgniteLifecycleHandler: ILifecycleHandler
    {
        public void OnLifecycleEvent(LifecycleEventType evt)
        {
            if (evt == LifecycleEventType.AfterNodeStart)
            {
                Started = true;
                Serilog.Log.Logger.Information("Ignite AfterNodeStart");
            }
            else if (evt == LifecycleEventType.AfterNodeStop)
            {
                Started = false;
                Serilog.Log.Logger.Information("Ignite AfterNodeStop");
            }
        }

        public bool Started { get; private set; }
    }
}
