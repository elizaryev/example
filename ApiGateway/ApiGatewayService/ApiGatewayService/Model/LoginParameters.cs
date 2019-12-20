namespace ApiGatewayService.Model
{
    public class LoginParameters
    {
        public string CartOrderId { get; set; }
        public bool RememberMe { get; set; }
        public int YPSessionTimeout { get; set; }
        public string YPUICulture { get; set; }
    }
}
