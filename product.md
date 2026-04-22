# B. NỘI DUNG CHÍNH CỦA SẢN PHẨM

## 1. Tính cấp thiết của sản phẩm

Trong bối cảnh chuyển đổi số giáo dục và xu hướng đưa trí tuệ nhân tạo vào dạy học, nhu cầu về một công cụ giúp giáo viên, học sinh, sinh viên có thể tiếp cận machine learning theo cách trực quan, dễ sử dụng và phù hợp với thực tiễn là rất cấp thiết. Trên thực tế, dù các khái niệm như AI, học máy, nhận diện hình ảnh ngày càng phổ biến, việc tổ chức một hoạt động học tập hoặc thực hành có tính tương tác cao vẫn gặp nhiều rào cản. Phần lớn người học và không ít giáo viên chưa có nền tảng lập trình, chưa quen với môi trường phát triển AI, hoặc không có điều kiện triển khai các công cụ kỹ thuật phức tạp trong thời gian ngắn.

Hiện nay đã có một số công cụ hỗ trợ huấn luyện mô hình nhận diện hình ảnh theo hướng thân thiện hơn với người dùng, tiêu biểu như Teachable Machine hoặc một số nền tảng AutoML chạy trên web. Tuy nhiên, các công cụ này vẫn còn những hạn chế nhất định trong bối cảnh dạy học và triển khai thực tế. Thứ nhất, nhiều công cụ phụ thuộc vào môi trường trực tuyến, yêu cầu kết nối internet ổn định hoặc phụ thuộc vào nền tảng đám mây. Thứ hai, quy trình quản lý dữ liệu, tổ chức bài thực hành, huấn luyện, trình diễn và xuất mô hình thường chưa được tích hợp thành một không gian làm việc thống nhất, dẫn đến trải nghiệm bị phân mảnh. Thứ ba, dữ liệu và mô hình của người dùng đôi khi phải đi qua dịch vụ bên ngoài, chưa thật sự phù hợp với yêu cầu riêng tư dữ liệu trong giáo dục hoặc trong các đơn vị muốn chủ động kiểm soát hoàn toàn tài nguyên của mình.

Từ thực tiễn đó, sản phẩm **PlantML** được xây dựng nhằm giải quyết một nhu cầu rất cụ thể: tạo ra một ứng dụng desktop giúp người dùng có thể tự thu thập dữ liệu, tự huấn luyện mô hình nhận diện hình ảnh, kiểm tra kết quả ngay lập tức và quản lý toàn bộ quá trình này ngay trên thiết bị của mình. Sản phẩm hướng tới việc làm cho machine learning trở nên gần gũi, dễ tiếp cận và có thể triển khai thành hoạt động học tập, trải nghiệm, thực hành một cách nhanh chóng. Đây là một hướng tiếp cận cần thiết trong bối cảnh giáo dục hiện nay, khi mục tiêu không chỉ là “giới thiệu AI” mà còn phải giúp người học thật sự được tương tác với AI bằng chính thiết bị và dữ liệu của mình.

## 2. Mục đích của sản phẩm

**PlantML** được xây dựng với mục đích chính là hỗ trợ người dùng tạo và huấn luyện mô hình nhận diện hình ảnh từ dữ liệu của chính mình theo một quy trình đơn giản, trực quan và dễ tiếp cận. Thông qua sản phẩm, người dùng có thể đi từ việc thu thập ảnh mẫu, tổ chức dữ liệu theo từng nhóm đối tượng, huấn luyện mô hình, đến bước trình diễn và kiểm tra kết quả mà không cần viết mã lệnh, không cần cấu hình hệ thống AI phức tạp, và không cần phụ thuộc vào hạ tầng điện toán đám mây.

Đối với lĩnh vực giáo dục và đào tạo, sản phẩm hướng tới việc giải quyết một số nhu cầu thực tế đang đặt ra. Trước hết, sản phẩm giúp giáo viên và người học có một công cụ để tổ chức các hoạt động thực hành AI theo hướng “học qua trải nghiệm”, trong đó người học không chỉ nghe giải thích lý thuyết mà còn trực tiếp thấy máy tính học từ dữ liệu như thế nào. Thứ hai, sản phẩm giúp rút ngắn đáng kể khoảng cách từ ý tưởng đến kết quả: chỉ với một số ảnh mẫu đơn giản, người dùng đã có thể nhanh chóng huấn luyện và kiểm tra một mô hình hoạt động được. Thứ ba, sản phẩm tạo điều kiện để cá nhân hóa nội dung học tập, vì mỗi giáo viên hoặc người học có thể tự lựa chọn đối tượng nhận diện phù hợp với môn học, bối cảnh lớp học hoặc nhu cầu khám phá riêng.

Lợi ích chính mà sản phẩm mang lại cho công tác giáo dục và đào tạo là tăng tính trực quan, tính tương tác và khả năng tiếp cận đối với machine learning. Thay vì coi AI là một lĩnh vực quá xa vời hoặc chỉ dành cho người có chuyên môn sâu, PlantML giúp biến AI thành một trải nghiệm có thể quan sát, thử nghiệm và điều chỉnh ngay trong quá trình học. Bên cạnh đó, việc sản phẩm chạy cục bộ trên thiết bị người dùng cũng giúp nâng cao tính chủ động, đảm bảo dữ liệu được lưu trữ tại chỗ, phù hợp với các môi trường dạy học cần tính riêng tư, an toàn và khả năng triển khai linh hoạt.

## 3. Mô tả sản phẩm dự thi

### a) Nguyên lý của sản phẩm

Sản phẩm **PlantML** được thực hiện theo nguyên lý kết hợp giữa quản lý dữ liệu cục bộ, giao diện tương tác trực quan và kỹ thuật học chuyển giao trong nhận diện hình ảnh. Về mặt hệ thống, đây là một ứng dụng desktop chạy trên máy tính cá nhân, trong đó toàn bộ quy trình từ tạo dự án, thu thập dữ liệu, huấn luyện mô hình, kiểm tra kết quả đến xuất mô hình đều được thực hiện trong cùng một môi trường làm việc thống nhất.

Về nguyên lý học máy, PlantML sử dụng mô hình **MobileNet** làm backbone trích xuất đặc trưng hình ảnh. Đây là một mô hình đã được huấn luyện trước trên tập dữ liệu lớn, có khả năng chuyển ảnh đầu vào thành các vector đặc trưng giàu thông tin. Trên nền các đặc trưng đó, hệ thống tiếp tục huấn luyện một **classifier head** cho bài toán phân loại do người dùng tự xác định. Cách tiếp cận này giúp rút ngắn thời gian huấn luyện, giảm yêu cầu về tài nguyên tính toán và vẫn đảm bảo hiệu quả tốt đối với các bài toán nhận diện hình ảnh cơ bản trong giáo dục.

Sản phẩm được xây dựng bằng các công cụ kỹ thuật hiện đại, trong đó phần giao diện và xử lý người dùng được phát triển bằng **React + TypeScript**, phần vỏ ứng dụng desktop sử dụng **Tauri**, và dữ liệu dự án được lưu trữ cục bộ bằng **SQLite**. Quá trình huấn luyện và suy luận mô hình được thực hiện bằng **TensorFlow.js**, có thể tận dụng backend **WebGL** để tăng tốc trên thiết bị người dùng. Các yếu tố tác động trực tiếp đến chất lượng của sản phẩm bao gồm số lượng và chất lượng ảnh mẫu, sự cân bằng giữa các lớp dữ liệu, mức độ đa dạng của điều kiện chụp ảnh, cũng như các tham số huấn luyện như số epochs, learning rate, batch size và tỉ lệ validation split.

### b) Các nội dung chủ yếu

PlantML được thiết kế theo hướng “một dự án - một bài toán nhận diện”, trong đó mỗi **project** là một không gian làm việc độc lập cho một nhiệm vụ phân loại hình ảnh cụ thể. Cấu trúc và quy trình công nghệ của sản phẩm gồm các thành phần chính sau:

**Thứ nhất, quản lý dự án.** Người dùng có thể tạo mới, chỉnh sửa, tìm kiếm, đánh dấu yêu thích, xóa hoặc xuất dự án. Mỗi dự án lưu trữ tên, mô tả, biểu tượng đại diện, cấu hình dữ liệu, cấu hình huấn luyện, cấu hình trình diễn và các lần huấn luyện đã thực hiện. Cách tổ chức này giúp người dùng dễ dàng tách biệt từng bài toán nhận diện khác nhau, ví dụ phân biệt rau củ, nhận diện đồ vật học tập, hoặc phân loại một nhóm hình ảnh phục vụ bài giảng.

**Thứ hai, tổ chức và thu thập dữ liệu.** Trong mỗi dự án, người dùng tạo các **class** tương ứng với các nhóm đối tượng cần phân biệt. Hệ thống hỗ trợ thêm ảnh mẫu từ hai nguồn chính: ảnh có sẵn trên thiết bị và ảnh chụp từ camera. Dữ liệu được lưu cục bộ theo cấu trúc thống nhất, đồng thời có thể xem trực tiếp dưới dạng lưới ảnh để kiểm tra chất lượng, số lượng và tính đa dạng của tập dữ liệu. Đây là bước rất quan trọng vì chất lượng mô hình phụ thuộc mạnh vào dữ liệu đầu vào.

**Thứ ba, cấu hình và huấn luyện mô hình.** Người dùng có thể điều chỉnh các tham số huấn luyện như số epochs, learning rate, batch size, tỉ lệ validation split, image size và early stopping. Khi bắt đầu huấn luyện, hệ thống tự động chuẩn bị môi trường chạy, tải backbone MobileNet, chia dữ liệu thành tập huấn luyện và validation, trích xuất embeddings, huấn luyện classifier head, sau đó lưu model vào workspace của dự án. Giao diện huấn luyện được thiết kế thành ba lớp thông tin bổ trợ nhau:

- phần **tóm tắt kết quả** hiển thị các chỉ số quan trọng như accuracy, loss, validation accuracy, validation loss;
- phần **timeline** mô tả ngắn gọn các giai đoạn chính của quá trình train;
- phần **log chi tiết** ghi lại đầy đủ các sự kiện trong suốt phiên huấn luyện để phục vụ kiểm tra, đối chiếu và giải thích quy trình.

**Thứ tư, trình diễn và kiểm tra mô hình.** Sau khi huấn luyện thành công, người dùng có thể chuyển sang chế độ **Play** để kiểm tra mô hình ngay trong ứng dụng. Hệ thống hỗ trợ hai cách trình diễn chính: tải ảnh lên để dự đoán và dùng camera trực tiếp để dự đoán theo thời gian thực. Ngoài kết quả dự đoán, giao diện còn cho phép điều chỉnh các thiết lập như số lớp hiển thị, ngưỡng tin cậy, khoảng thời gian chạy dự đoán và một số tuỳ chọn hiển thị khác. Cách thiết kế này giúp người dùng dễ dàng quan sát phản hồi của mô hình trong tình huống gần với thực tế sử dụng.

**Thứ năm, xuất mô hình.** PlantML cho phép xuất mô hình đã huấn luyện ra ngoài dưới định dạng **TensorFlow.js** để tiếp tục sử dụng trong môi trường web hoặc các ứng dụng khác. Đây là một đặc điểm quan trọng vì sản phẩm không dừng ở mức “trình diễn trong ứng dụng” mà còn mở ra khả năng tái sử dụng kết quả cho những mục đích rộng hơn.

Về giao diện, sản phẩm được thiết kế theo hướng trực quan, tối giản và bám sát tiến trình thao tác của người dùng. Từ trang chủ đến các trang con trong từng dự án, các bước **Label - Train - Play** được thể hiện rõ ràng, giúp người dùng dễ hình dung quy trình. Các quyết định thiết kế ưu tiên khả năng sử dụng thực tế: hiển thị vừa đủ thông tin ở mức tổng quan, nhưng vẫn cho phép đào sâu vào chi tiết khi cần. Đây là điểm quan trọng giúp sản phẩm vừa phù hợp với người mới bắt đầu, vừa đủ rõ ràng để phục vụ việc học và giảng dạy có định hướng.

### c) Kết quả của sản phẩm

Kết quả của sản phẩm thể hiện ở cả mặt kỹ thuật, mặt chức năng và mặt trải nghiệm sử dụng.

Về kỹ thuật, sản phẩm đã xây dựng được một quy trình khép kín cho bài toán phân loại hình ảnh cục bộ trên máy tính cá nhân. Toàn bộ dữ liệu dự án, dữ liệu ảnh mẫu, cấu hình huấn luyện, log huấn luyện và mô hình sau khi huấn luyện đều được lưu trữ trên thiết bị người dùng. Hệ thống có thể chạy offline, không yêu cầu tài khoản, không cần phụ thuộc vào dịch vụ đám mây để hoàn thành các chức năng chính.

Về chức năng, sản phẩm hiện đã đạt được các khả năng sau:

- tạo và quản lý nhiều dự án độc lập;
- tạo class và thu thập ảnh mẫu từ camera hoặc ảnh tải lên;
- cấu hình tham số huấn luyện;
- huấn luyện mô hình nhận diện hình ảnh bằng MobileNet và classifier head;
- theo dõi tiến trình huấn luyện bằng số liệu tổng quan, timeline và log chi tiết;
- kiểm tra mô hình bằng ảnh tải lên hoặc camera trực tiếp;
- xuất mô hình để sử dụng trong môi trường khác.

Về trải nghiệm sử dụng, sản phẩm cho phép người dùng nhanh chóng đi từ dữ liệu ví dụ đến một mô hình có thể trình diễn được. Đây là kết quả rất có ý nghĩa trong bối cảnh giáo dục, vì thay vì chỉ dừng ở việc mô tả lý thuyết, sản phẩm tạo ra được một môi trường thực hành cụ thể để người học quan sát máy tính “học” từ dữ liệu ra sao, từ đó hiểu sâu hơn về bản chất của machine learning. Bên cạnh đó, việc chia quy trình thành các bước rõ ràng, hỗ trợ sensible defaults và cung cấp thông tin phản hồi liên tục cũng giúp giảm đáng kể rào cản tiếp cận đối với người dùng không chuyên.

## 4. Tự đánh giá sản phẩm

### a) Tính mới và tính sáng tạo

Tính mới của PlantML không nằm ở việc tạo ra một thuật toán học máy hoàn toàn mới, mà nằm ở cách tổ chức lại trải nghiệm xây dựng mô hình nhận diện hình ảnh thành một sản phẩm desktop phù hợp với dạy học, thực hành và phổ cập kiến thức về machine learning. Điểm sáng tạo của sản phẩm là kết nối liền mạch các khâu vốn thường rời rạc — từ thu thập dữ liệu, quản lý dự án, huấn luyện, trình diễn đến xuất mô hình — trong cùng một không gian làm việc cục bộ, không yêu cầu lập trình và không phụ thuộc internet.

Sản phẩm cũng thể hiện tính sáng tạo ở cách thiết kế trải nghiệm người dùng. Thay vì chỉ cung cấp một công cụ train mô hình, PlantML hướng đến việc làm cho machine learning trở nên “có thể chạm vào được”: người dùng thấy được dữ liệu mình đưa vào, thấy được tiến trình train, thấy được kết quả mô hình phản hồi, và có thể điều chỉnh hoặc thử lại ngay. Đây là giá trị quan trọng trong giáo dục, vì nó biến một khái niệm kỹ thuật cao thành một trải nghiệm học tập có tính trực quan và thực hành cao.

### b) Hiệu quả

**- Sư phạm**

PlantML hỗ trợ rất tốt cho việc tổ chức hoạt động dạy học theo hướng trải nghiệm và thực hành. Giáo viên có thể nhanh chóng tạo ra các bài học hoặc bài tập minh họa về AI bằng chính các đồ vật, hình ảnh hoặc bối cảnh quen thuộc với người học. Người học không cần có nền tảng lập trình vẫn có thể tham gia đầy đủ vào quy trình xây dựng mô hình: từ chuẩn bị dữ liệu đến quan sát kết quả. Điều này giúp tăng tính tương tác, tăng hứng thú học tập, đồng thời hỗ trợ cá nhân hóa nội dung học theo từng nhóm đối tượng hoặc từng chủ đề cụ thể.

Ngoài ra, sản phẩm còn giúp tiết kiệm thời gian và công sức cho giáo viên trong việc chuẩn bị bài thực hành. Thay vì phải kết hợp nhiều công cụ khác nhau, giáo viên có thể sử dụng một môi trường thống nhất để minh họa toàn bộ chu trình machine learning ở mức cơ bản. Nhờ đó, hoạt động dạy học trở nên rõ ràng, liền mạch và dễ triển khai hơn trong thực tế.

**- Kinh tế**

Về mặt kinh tế, sản phẩm có ưu điểm là không yêu cầu hạ tầng đám mây, không cần chi phí duy trì tài khoản trực tuyến và không đòi hỏi hệ thống phần cứng chuyên dụng ở mức cao đối với các bài toán cơ bản. Việc chạy cục bộ ngay trên thiết bị người dùng giúp giảm chi phí triển khai, đặc biệt phù hợp với các trường học, đơn vị đào tạo hoặc nhóm nghiên cứu nhỏ muốn tiếp cận AI theo hướng tiết kiệm, linh hoạt và chủ động.

Mặt khác, mô hình sau khi huấn luyện có thể được xuất ra để tái sử dụng, giúp nâng cao giá trị khai thác của sản phẩm beyond phạm vi một buổi học hay một bài thực hành cụ thể. Điều này góp phần làm tăng hiệu quả đầu tư cho công cụ.

**- Kỹ thuật**

Về mặt kỹ thuật, PlantML có các ưu điểm nổi bật như: cấu trúc rõ ràng, khả năng chạy cục bộ, dữ liệu được tổ chức theo project, quy trình train và demo được tích hợp, và có khả năng export mô hình. So với các công cụ chỉ tập trung vào một mắt xích riêng lẻ, sản phẩm mang lại một chu trình làm việc đồng bộ hơn. Hệ thống cũng có tính linh hoạt nhất định khi cho phép điều chỉnh các tham số huấn luyện, thay đổi nguồn dữ liệu đầu vào, và kiểm tra mô hình theo nhiều hình thức khác nhau.

Đặc biệt, việc sử dụng MobileNet kết hợp classifier head giúp cân bằng tốt giữa tốc độ và hiệu quả, phù hợp với môi trường desktop phổ thông. Đây là lựa chọn kỹ thuật hợp lý cho mục tiêu giáo dục và thực hành, nơi tính trực quan, tốc độ phản hồi và khả năng triển khai thực tế quan trọng không kém độ phức tạp của thuật toán.

### c) Khả năng áp dụng

PlantML có khả năng áp dụng cho nhiều nhóm đối tượng khác nhau, bao gồm giáo viên, học sinh, sinh viên, các cơ sở giáo dục, câu lạc bộ STEM, các nhóm nghiên cứu nhỏ, cũng như những cá nhân muốn tự học và khám phá machine learning thông qua ví dụ thực tế. Sản phẩm đặc biệt phù hợp với các bối cảnh cần một công cụ dễ triển khai, dễ sử dụng và không phụ thuộc vào internet.

Khả năng nhân rộng của sản phẩm là khả thi vì đây là một ứng dụng desktop có thể triển khai trên nhiều máy tính cá nhân, đồng thời không yêu cầu hạ tầng phức tạp đi kèm. Mô hình tổ chức theo dự án cũng tạo điều kiện để mở rộng nội dung, tái sử dụng dữ liệu và chia sẻ mô hình huấn luyện theo các chủ đề khác nhau. Trong tương lai, sản phẩm có thể tiếp tục được mở rộng thêm về số lượng ngôn ngữ hỗ trợ, kiểu dữ liệu đầu vào, dạng mô hình hoặc các kịch bản ứng dụng chuyên sâu hơn trong giáo dục và đào tạo.

Về duy trì và phát triển, sản phẩm có nền tảng kỹ thuật tương đối rõ ràng, cấu trúc thành phần tách lớp tốt và có tiềm năng tiếp tục hoàn thiện. Điều này giúp PlantML không chỉ phù hợp cho mục tiêu dự thi mà còn có khả năng trở thành một công cụ ứng dụng thực tế lâu dài.

## 5. Các thuyết minh khác

Ngoài các nội dung nêu trên, PlantML còn có thể được xem như một cầu nối giữa nhận thức ban đầu về AI và trải nghiệm thực hành cụ thể với AI. Giá trị lớn nhất của sản phẩm không chỉ là huấn luyện được một mô hình nhận diện hình ảnh, mà còn nằm ở chỗ giúp người dùng hiểu rằng machine learning là một quá trình có thể quan sát, điều chỉnh và cải thiện thông qua dữ liệu.

Trong quá trình tiếp tục hoàn thiện, sản phẩm có thể được phát triển thêm các bộ dự án mẫu, tài liệu hướng dẫn cho giáo viên và học sinh, cũng như các kịch bản ứng dụng theo từng chủ đề học tập cụ thể. Đây là cơ sở thuận lợi để PlantML mở rộng vai trò từ một công cụ thực hành kỹ thuật thành một phương tiện hỗ trợ đổi mới hoạt động dạy học trong bối cảnh giáo dục số.
