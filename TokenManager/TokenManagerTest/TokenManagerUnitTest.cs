using System.Threading.Tasks;
using Xunit;

namespace TokenManagerTest
{
    public class TokenManagerUnitTest
    {
        // for Mock interface
        static TokenManagerUnitTest()
        {

        }

        [Fact]
        public void TokenManager_InvalidArguments_ThrowsArgumentException()
        {
            // Arrange
            // Act
            // Assert
        }

        /// <summary>
        /// </summary>
        /// <param name="inputParameter"></param>
        /// <returns></returns>
        [InlineData("inputParameter")]
        [Theory]
        public async Task TokenManager_Fails_ReturnsFailResult(string inputParameter)
        {
            // Arrange
            // Act
            //Assert
        }
    }
}
